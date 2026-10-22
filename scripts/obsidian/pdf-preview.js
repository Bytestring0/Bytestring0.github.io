import { Component } from 'obsidian';

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

export class PdfPreview {
  constructor(dialog, nativePrint, getSnapshot, css) {
    this.dialog = dialog; this.nativePrint = nativePrint; this.getSnapshot = getSnapshot; this.css = css;
    this.owner = dialog.contentEl.ownerDocument.defaultView; this.version = 0; this.tasks = new Map();
    this.pane = dialog.contentEl.createDiv({ cls: 'mizuki-pdf-preview' });
    const header = this.pane.createDiv({ cls: 'mizuki-pdf-preview-header' });
    header.createSpan({ text: 'PDF 预览' });
    this.status = header.createSpan({ cls: 'mizuki-pdf-preview-status', attr: { role: 'status', 'aria-live': 'polite' } });
    this.pages = this.pane.createDiv({ cls: 'mizuki-pdf-preview-pages', attr: { 'aria-label': 'PDF 页面预览' } });
    this.resize = new this.owner.ResizeObserver(() => this.refreshVisible()); this.resize.observe(this.pages);
    this.schedule();
  }
  schedule() {
    if (this.disposed) return;
    const snapshot = this.getSnapshot(), key = JSON.stringify(snapshot);
    if (key === this.requestedKey) return;
    this.requestedKey = key; this.version++; this.dueAt = Date.now() + 350;
    clearTimeout(this.timer); this.status.setText('正在更新…'); this.pages.classList.add('is-updating');
    this.timer = setTimeout(() => void this.update(), 350);
  }
  async ensureWindow() {
    if (this.win && !this.win.closed) return;
    const win = this.win = this.owner.open('about:blank', '_blank', 'popup,hide=true');
    if (!win) throw new Error('无法创建 PDF 渲染窗口');
    // Obsidian uses the same helper to initialize DOM methods in its PDF window.
    if (typeof this.owner.globalEnhance !== 'function') throw new Error('当前 Obsidian 缺少导出窗口支持');
    win.eval.call(win, '(' + this.owner.globalEnhance.toString() + ')()');
    const doc = win.document, base = doc.createElement('base'); base.href = this.owner.location.href; doc.head.appendChild(base);
    doc.documentElement.lang = this.owner.document.documentElement.lang;
    doc.body.className = this.owner.document.body.className;
    doc.body.classList.remove('theme-dark'); doc.body.classList.add('theme-light');
    for (const property of this.owner.document.body.style) if (property.startsWith('--') && !['--zoom-factor', '--keyboard-height'].includes(property)) doc.body.style.setProperty(property, this.owner.document.body.style.getPropertyValue(property));
    doc.documentElement.style.fontSize = this.owner.getComputedStyle(this.owner.document.body).fontSize;
    const loads = [];
    for (const source of this.owner.document.head.querySelectorAll('style,link[rel="stylesheet"]')) {
      const clone = source.cloneNode(true);
      if (source.tagName === 'STYLE') {
        try { clone.textContent = [...source.sheet.cssRules].map(rule => rule.cssText).join('\n'); } catch { /* Inline source remains available. */ }
      } else {
        clone.href = source.href;
        loads.push(new Promise((resolve, reject) => {
          const timer = setTimeout(() => reject(new Error('PDF 样式加载超时')), 10000);
          clone.onload = () => { clearTimeout(timer); resolve(); };
          clone.onerror = () => { clearTimeout(timer); reject(new Error('PDF 样式加载失败')); };
        }));
      }
      doc.head.appendChild(clone);
    }
    await Promise.all(loads);
    if (this.disposed) throw new Error('预览已关闭');
    for (let attempt = 0; !win.require && attempt < 40; attempt++) await delay(25);
    const electron = win.require?.('electron');
    const remote = electron?.remote || win.require?.('@electron/remote');
    this.contents = remote?.getCurrentWebContents();
    // Never print the main Obsidian window if the child bridge is unavailable.
    if (!this.contents || this.contents.id === this.owner.electron.remote.getCurrentWebContents().id || this.contents.getURL() !== 'about:blank') throw new Error('无法连接独立的 PDF 渲染窗口');
    this.style = doc.createElement('style'); doc.head.appendChild(this.style);
    this.root = doc.body.createDiv({ cls: 'print' });
  }
  async generate(snapshot) {
    await this.ensureWindow();
    if (this.disposed) throw new Error('预览已关闭');
    this.style.textContent = this.css(snapshot);
    const renderKey = JSON.stringify([snapshot.includeName, snapshot.pageSize, snapshot.landscape]);
    if (renderKey !== this.renderKey) {
      this.component?.unload(); this.root.empty(); this.component = new Component(); this.component.load();
      await this.nativePrint.call(this.dialog, this.root, this.component, snapshot.includeName);
      this.renderKey = renderKey;
    }
    await this.win.document.fonts.ready;
    await Promise.all([...this.root.querySelectorAll('img')].map(image => image.decode?.().catch(() => {})));
    if (this.disposed) throw new Error('预览已关闭');
    const options = { printBackground: true, pageSize: snapshot.pageSize, landscape: snapshot.landscape, scale: snapshot.scale };
    if (snapshot.margin !== 0) options.margins = { top: 0, bottom: 0, left: 0, right: 0 };
    return this.contents.printToPDF(options);
  }
  async update() {
    if (this.disposed) return;
    if (this.running) return this.running;
    const version = this.version, snapshot = this.getSnapshot(), key = JSON.stringify(snapshot);
    this.running = (async () => {
      try {
        const buffer = await this.generate(snapshot);
        if (this.disposed || version !== this.version) return;
        await this.display(buffer, version);
        if (this.disposed || version !== this.version) return;
        this.buffer = buffer; this.readyKey = key; this.failedKey = undefined;
        this.status.setText(`${this.pdf.numPages} 页`); this.status.title = ''; this.pages.classList.remove('is-updating');
      } catch (error) {
        if (!this.disposed && version === this.version) {
          this.failedKey = key; this.lastError = error; this.status.setText('预览失败，仍可使用原生导出'); this.status.title = error.message;
          this.pages.classList.remove('is-updating');
        }
      }
    })().finally(() => {
      this.running = undefined;
      if (!this.disposed && version !== this.version) { clearTimeout(this.timer); this.timer = setTimeout(() => void this.update(), Math.max(0, this.dueAt - Date.now())); }
    });
    return this.running;
  }
  async getPdf() {
    this.schedule(); clearTimeout(this.timer);
    const key = JSON.stringify(this.getSnapshot());
    while (!this.disposed && this.readyKey !== key) {
      await this.update();
      if (this.failedKey === key) throw this.lastError;
    }
    if (this.disposed || !this.buffer) throw new Error('PDF 预览已关闭');
    return this.buffer;
  }
  async display(buffer, version) {
    const pdfJsUrl = 'app://obsidian.md/lib/pdfjs/pdf.min.mjs';
    const pdfjs = this.owner.pdfjsLib || await import(pdfJsUrl);
    if (!pdfjs.GlobalWorkerOptions.workerSrc) pdfjs.GlobalWorkerOptions.workerSrc = 'app://obsidian.md/lib/pdfjs/pdf.worker.min.mjs';
    const loading = this.loading = pdfjs.getDocument({ data: new Uint8Array(buffer) });
    const pdf = await loading.promise;
    if (this.disposed || version !== this.version) { await pdf.destroy(); return; }
    this.observer?.disconnect(); this.cancelCanvases(); await this.pdf?.destroy();
    const scrollRatio = this.pages.scrollTop / Math.max(1, this.pages.scrollHeight - this.pages.clientHeight);
    this.pdf = pdf; this.pages.empty();
    const first = await pdf.getPage(1), size = first.getViewport({ scale: 1 });
    this.observer = new this.owner.IntersectionObserver(entries => {
      for (const entry of entries) {
        entry.target.classList.toggle('is-visible', entry.isIntersecting);
        if (entry.isIntersecting) void this.drawPage(entry.target);
        else this.releaseCanvas(entry.target);
      }
    }, { root: this.pages, rootMargin: '250px' });
    for (let number = 1; number <= pdf.numPages; number++) {
      const page = this.pages.createDiv({ cls: 'mizuki-pdf-preview-page', attr: { 'aria-label': `第 ${number} 页` } });
      page.dataset.page = String(number); page.style.aspectRatio = `${size.width} / ${size.height}`; this.observer.observe(page);
    }
    this.pages.scrollTop = scrollRatio * Math.max(0, this.pages.scrollHeight - this.pages.clientHeight);
  }
  releaseCanvas(element) {
    const task = this.tasks.get(element); task?.cancel(); this.tasks.delete(element);
    element.dataset.width = ''; element.dataset.generation = String((Number(element.dataset.generation) || 0) + 1);
    const canvas = element.querySelector('canvas'); if (canvas) { canvas.width = 0; canvas.height = 0; canvas.remove(); }
  }
  cancelCanvases() { for (const element of this.tasks.keys()) this.releaseCanvas(element); }
  refreshVisible() { for (const element of this.pages.querySelectorAll('.is-visible')) void this.drawPage(element); }
  async drawPage(element) {
    const width = Math.floor(element.clientWidth), pdf = this.pdf;
    if (!width || !pdf || this.disposed || element.dataset.width === String(width)) return;
    this.releaseCanvas(element); element.dataset.width = String(width);
    const generation = element.dataset.generation;
    try {
      const page = await pdf.getPage(Number(element.dataset.page));
      if (this.disposed || pdf !== this.pdf || !element.isConnected || element.dataset.generation !== generation) return;
      const size = page.getViewport({ scale: 1 });
      const viewport = page.getViewport({ scale: width / size.width * Math.min(this.owner.devicePixelRatio || 1, 2) });
      const canvas = element.createEl('canvas'); canvas.width = Math.ceil(viewport.width); canvas.height = Math.ceil(viewport.height);
      const task = page.render({ canvasContext: canvas.getContext('2d'), viewport }); this.tasks.set(element, task);
      await task.promise;
    } catch (error) { if (!this.disposed && error.name !== 'RenderingCancelledException') this.status.setText('部分页面预览失败'); }
    finally { if (element.dataset.generation === generation) this.tasks.delete(element); }
  }
  dispose() {
    if (this.disposed) return; this.disposed = true; clearTimeout(this.timer);
    this.observer?.disconnect(); this.resize.disconnect(); this.cancelCanvases();
    for (const page of this.pages.querySelectorAll('.mizuki-pdf-preview-page')) this.releaseCanvas(page);
    this.pages.empty();
    this.pdf?.destroy().catch(() => {}); this.loading?.destroy().catch(() => {});
    this.component?.unload(); if (this.win && !this.win.closed) this.win.close(); this.buffer = undefined;
  }
}
