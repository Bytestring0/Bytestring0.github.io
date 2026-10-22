import { MarkdownView, Modal, Notice, Setting } from 'obsidian';
import fs from 'node:fs';
import { PdfPreview } from './pdf-preview.js';

const defaults = { fontSize: 12, lineHeight: 1.5 };
const valid = (value, min, max) => Number.isFinite(value) && value >= min && value <= max;

// Typography is injected into the native export document, after its Markdown
// rendering finishes. No screen styles or global print CSS are changed.
function printCss({ fontSize, lineHeight }) {
  return `@media print {
    .print { --font-text-size: ${fontSize}pt; --line-height-normal: ${lineHeight}; }
    .print .markdown-preview-view {
      --font-text-size: ${fontSize}pt;
      --line-height-normal: ${lineHeight};
      font-size: ${fontSize}pt !important;
      line-height: ${lineHeight} !important;
    }
    .print .markdown-preview-view :is(p, li, blockquote, table, td, th) { line-height: ${lineHeight} !important; }
    body::before { display: none !important; }
  }`;
}

export class PdfExportControls {
  constructor(plugin) {
    this.plugin = plugin;
    const saved = plugin.settings.pdfExport || {};
    this.values = {
      fontSize: valid(saved.fontSize, 6, 36) ? saved.fontSize : defaults.fontSize,
      lineHeight: valid(saved.lineHeight, 1, 3) ? saved.lineHeight : defaults.lineHeight,
    };
    this.dialogs = new Map();
    this.saveChain = Promise.resolve();
  }
  install() {
    const original = MarkdownView.prototype.printToPdf;
    if (typeof original !== 'function') { new Notice('当前 Obsidian 版本无法添加 PDF 字号与行距设置'); return; }
    const controls = this;
    function wrapped(...args) {
      if (controls.disposed) return original.apply(this, args);
      // The native method synchronously constructs and opens its export modal.
      // Capture that instance only during this call; restore Modal.open at once.
      const nativeOpen = Modal.prototype.open;
      const view = this;
      let dialog;
      function capture(...openArgs) {
        if (this.app === view.app && this.file === view.file && typeof this.print === 'function' && typeof this.printToPdf === 'function' && 'scaleFactor' in this) dialog = this;
        return nativeOpen.apply(this, openArgs);
      }
      Modal.prototype.open = capture;
      try { return original.apply(this, args); }
      finally {
        if (Modal.prototype.open === capture) Modal.prototype.open = nativeOpen;
        if (dialog) controls.attach(dialog);
      }
    }
    MarkdownView.prototype.printToPdf = wrapped;
    this.plugin.register(() => {
      this.disposed = true;
      if (MarkdownView.prototype.printToPdf === wrapped) MarkdownView.prototype.printToPdf = original;
      for (const entry of this.dialogs.values()) entry.cleanup(true);
      this.dialogs.clear();
    });
  }
  save() {
    this.plugin.settings.pdfExport = { ...this.values };
    this.saveChain = this.saveChain.catch(() => {}).then(() => this.plugin.saveData(this.plugin.settings));
    this.saveChain.catch(error => new Notice(`PDF 排版设置保存失败：${error.message}`));
  }
  attach(dialog) {
    if (this.disposed || this.dialogs.has(dialog)) return;
    dialog.modalEl.addClass('mizuki-pdf-export-modal');
    const originalChildren = [...dialog.contentEl.childNodes];
    const settingsPane = dialog.contentEl.createDiv({ cls: 'mizuki-pdf-settings' });
    for (const child of originalChildren) settingsPane.appendChild(child);
    const section = settingsPane.createDiv({ cls: 'mizuki-pdf-typography' });
    const values = { ...this.values }, invalid = new Set(), inputs = new Map();
    const addNumber = (key, name, desc, min, max, step) => {
      new Setting(section).setName(name).setDesc(desc).addText(control => {
        const input = control.inputEl;
        input.type = 'number'; input.min = String(min); input.max = String(max); input.step = String(step); input.required = true;
        input.style.width = '7em'; input.setAttribute('aria-label', name);
        control.setValue(String(values[key])).onChange(raw => {
          const value = raw.trim() ? Number(raw) : NaN;
          const accepted = valid(value, min, max);
          input.setAttribute('aria-invalid', String(!accepted));
          if (!accepted) { invalid.add(key); return; }
          invalid.delete(key); values[key] = value; this.values = { ...values }; this.save();
        });
        inputs.set(key, input);
      });
    };
    addNumber('fontSize', '正文字号（pt）', '6–36 pt；标题按原有比例缩放，只影响导出的 PDF。', 6, 36, 0.5);
    addNumber('lineHeight', '行距倍数', '1–3 倍，例如 1.5 为一倍半行距。', 1, 3, 0.05);
    if (dialog.buttonContainerEl?.parentElement === settingsPane) settingsPane.insertBefore(section, dialog.buttonContainerEl);
    const guard = event => {
      if (!invalid.size) return;
      event.preventDefault(); event.stopImmediatePropagation();
      inputs.get([...invalid][0])?.focus(); new Notice('请先填写有效的 PDF 字号和行距');
    };
    dialog.ctaEl?.addEventListener('click', guard, true);
    const nativePrint = dialog.print;
    const snapshot = () => ({ ...values, includeName: dialog.includeName.getValue(), pageSize: dialog.pageSize.getValue(), landscape: dialog.landscape.getValue(), margin: Number(dialog.marginsType.getValue()), scale: Math.max(0.1, Math.min(2, dialog.scaleFactor.getValue() / 100)) });
    const preview = new PdfPreview(dialog, nativePrint, snapshot, printCss);
    const changed = () => { if (!invalid.size) preview.schedule(); };
    dialog.contentEl.addEventListener('input', changed); dialog.contentEl.addEventListener('change', changed);
    async function styledPrint(container, ...args) {
      const typography = { ...values };
      const result = await nativePrint.apply(this, [container, ...args]);
      const style = container.ownerDocument.createElement('style');
      style.dataset.mizukiPdfTypography = 'true'; style.textContent = printCss(typography); container.appendChild(style);
      return result;
    }
    dialog.print = styledPrint;
    const nativeExport = dialog.printToPdf;
    let exporting = false;
    const previewExport = async function(options) {
      exporting = true;
      try {
        let buffer;
        try { buffer = await preview.getPdf(); }
        catch { new Notice('预览不可用，正在使用原生 PDF 导出'); return await nativeExport.call(this, options); }
        // Save exactly the bytes displayed in the preview, using the native
        // filename/overwrite dialog that has already run before this method.
        await fs.promises.writeFile(options.filepath, buffer);
        new Notice(`PDF 已保存：${options.filepath}`);
        if (options.open) {
          const error = await dialog.contentEl.ownerDocument.defaultView.electron.shell.openPath(options.filepath);
          if (error) new Notice('PDF 已保存，但默认阅读器打开失败：' + error);
        }
      } catch (error) { new Notice(`PDF 保存失败：${error.message}`); }
      finally { preview.dispose(); }
    };
    dialog.printToPdf = previewExport;
    const nativeClose = dialog.onClose;
    const controls = this;
    function closed(...args) {
      try { cleanup(); }
      finally { controls.dialogs.delete(dialog); }
      return nativeClose.apply(this, args);
    }
    function cleanup(unloading = false) {
      dialog.ctaEl?.removeEventListener('click', guard, true);
      dialog.contentEl.removeEventListener('input', changed); dialog.contentEl.removeEventListener('change', changed);
      if (unloading && !exporting) preview.dispose();
      else queueMicrotask(() => { if (!exporting) preview.dispose(); });
      preview.pane.remove(); section.remove();
      if (settingsPane.parentElement === dialog.contentEl) {
        for (const child of [...settingsPane.childNodes]) dialog.contentEl.insertBefore(child, settingsPane);
        settingsPane.remove();
      }
      dialog.modalEl.removeClass('mizuki-pdf-export-modal');
      if (unloading) {
        if (dialog.print === styledPrint) dialog.print = nativePrint;
        if (dialog.printToPdf === previewExport) dialog.printToPdf = nativeExport;
      }
      // Native export closes this modal BEFORE calling printToPdf(). Keep this
      // instance's print wrapper alive for that pending export; it is not global.
      if (dialog.onClose === closed) dialog.onClose = nativeClose;
    }
    dialog.onClose = closed;
    this.dialogs.set(dialog, { cleanup, preview });
  }
}
