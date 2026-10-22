import { Modal, Notice, setIcon } from 'obsidian';
import path from 'node:path';
import fs from 'node:fs';
import { LocalBridge } from './bridge.js';
import { buildExplicitContext, selectionAttachment } from './context.js';

let active;
export function install({ PiAgentPlugin, PiAgentView, PiRpcClient, ContextBuilder }) {
  ContextBuilder.prototype.buildPreAttachedContext = function(parsedPrompt, selection, options) { return buildExplicitContext(this, parsedPrompt, selection, options); };
  // Explicit @references, /current, and annotation actions still work. Merely
  // opening a note must not attach it or consume its annotations on send.
  PiAgentPlugin.prototype.getCurrentContextFile = function() { return undefined; };
  const onload = PiAgentPlugin.prototype.onload;
  PiAgentPlugin.prototype.onload = async function(...args) {
    active = new Enhancements(this); this.mizukiEnhancements = active;
    await active.bridge.start();
    this.register(() => this.mizukiEnhancements.dispose());
    await onload.apply(this, args);
    this.mizukiEnhancements.registerReferences();
  };
  const start = PiRpcClient.prototype.start;
  PiRpcClient.prototype.start = async function(...args) {
    if (active && !this.running && !this.startPromise) {
      const argv = [...(this.options.args || ['--mode', 'rpc'])];
      if (!argv.includes(active.extensionPath)) {
        argv.push('--extension', active.extensionPath);
        const index = argv.indexOf('--tools');
        if (index >= 0) argv[index + 1] = [...new Set([...argv[index + 1].split(','), 'question', 'obsidian_drawio', 'obsidian_excalidraw'])].join(',');
      }
      this.options.args = argv;
      const shim = this.options.piExecutablePath;
      if (process.platform === 'win32' && shim && /\.(cmd|ps1)$/i.test(shim) && fs.existsSync(shim)) {
        const contents = fs.readFileSync(shim, 'utf8');
        for (const match of contents.matchAll(/["']([^"'\r\n]*cli\.js)["']/g)) {
          const relative = match[1].replace(/^(?:%~?dp0%?|\$basedir)[\\/]/i, ''); const entry = path.resolve(path.dirname(shim), relative);
          const node = [path.join(path.dirname(shim),'node.exe'), ...(process.env.PATH || process.env.Path || '').split(path.delimiter).map(folder => path.join(folder,'node.exe'))].find(candidate => fs.existsSync(candidate));
          if (fs.existsSync(entry) && node) { this.options.mizukiDirect = { node, entry }; break; }
        }
      }
      const threadId = active.bridge.threadForArgs(argv);
      this.options.mizukiEnv = { ...active.bridge.environment, OBSIDIAN_PI_THREAD_ID: threadId };
      if (this.options.extensionUiHandler && !this.options.mizukiHandler) { const handler = this.options.extensionUiHandler; this.options.extensionUiHandler = request => handler({ ...request, threadId }); this.options.mizukiHandler = true; }
    }
    return start.apply(this, args);
  };
  const handler = PiAgentPlugin.prototype.getExtensionUiHandler;
  PiAgentPlugin.prototype.getExtensionUiHandler = function() {
    const fallback = handler.call(this); const enhancement = this.mizukiEnhancements;
    return request => ['select', 'confirm', 'input', 'editor'].includes(request.method) ? enhancement.nativeQuestion(request) : fallback(request);
  };
  for (const method of ['renderChatView', 'renderMessages', 'renderToolBadges']) {
    const original = PiAgentView.prototype[method];
    PiAgentView.prototype[method] = function(...args) { const result = original.apply(this, args); this.plugin.mizukiEnhancements?.decorate(this); return result; };
  }
  const cancel = PiAgentPlugin.prototype.cancelPiRun;
  PiAgentPlugin.prototype.cancelPiRun = function(...args) { this.mizukiEnhancements?.cancelQuestions(); return cancel.apply(this, args); };
  const exit = PiRpcClient.prototype.handleExit;
  PiRpcClient.prototype.handleExit = function(...args) { if (this.options.args?.includes('--session')) active?.cancelQuestions(this.options.mizukiEnv?.OBSIDIAN_PI_THREAD_ID); return exit.apply(this,args); };
}

class Enhancements {
  constructor(plugin) { this.plugin = plugin; this.questions = []; this.bridge = new LocalBridge(plugin, request => this.ask(request)); this.extensionPath = path.join(plugin.getPluginDirectory(), 'obsidian-tools.mjs'); }
  views() { return this.plugin.app.workspace.getLeavesOfType('pi-agent-view').map(leaf => leaf.view); }
  ask(request) {
    if (this.disposed) return Promise.resolve({ cancelled: true });
    const threadId = request.threadId || this.plugin.getCurrentThread().id;
    return new Promise(resolve => {
      const question = { ...request, threadId, id: request.id || crypto.randomUUID(), settled: false };
      this.questions.push(question);
      const settle = answer => {
        if (question.settled) return;
        question.settled = true; clearTimeout(question.expiry); question.signal?.removeEventListener('abort', question.abort);
        question.modal?.close(); this.questions = this.questions.filter(item => item !== question);
        resolve(answer); queueMicrotask(() => this.showNextQuestion());
      };
      question.settle = settle; question.abort = () => settle({ cancelled: true });
      if (question.signal?.aborted) question.abort(); else question.signal?.addEventListener('abort', question.abort, { once: true });
      if (!question.settled && question.timeout) question.expiry = setTimeout(question.abort, question.timeout);
      this.showNextQuestion();
    });
  }
  showNextQuestion() {
    if (this.disposed || this.questions.some(question => question.modal && !question.settled)) return;
    const question = this.questions.find(item => !item.settled);
    if (question) { question.modal = new QuestionModal(this, question); question.modal.open(); }
  }
  async nativeQuestion(request) {
    const result = await this.ask({ ...request, title: request.title || 'Pi 需要你的回答', options: request.method === 'confirm' ? [{ label: '是', value: true }, { label: '否', value: false }] : (request.options || []).map(option => ({ label: String(option), value: option })), allowOther: false });
    if (result.cancelled) return { cancelled: true };
    return request.method === 'confirm' ? { confirmed: result.value === true } : { value: result.value };
  }
  cancelQuestions(threadId = this.plugin.getCurrentThread().id) { for (const question of [...this.questions]) if (!threadId || question.threadId === threadId) question.settle({ cancelled: true }); }
  registerReferences() {
    this.plugin.addCommand({ id: 'quote-selected-text', name: '引用所选文字到 Pi', editorCallback: (editor, info) => void this.referenceSelection(this.editorSnapshot(editor, info)) });
    this.plugin.registerEvent(this.plugin.app.workspace.on('editor-menu', (menu, editor, info) => {
      const snapshot = this.editorSnapshot(editor, info); if (!snapshot?.text.trim()) return;
      menu.addItem(item => item.setTitle('引用所选文字到 Pi').setIcon('quote').onClick(() => void this.referenceSelection(snapshot)));
    }));
  }
  editorSnapshot(editor, info) { if (!editor || !info?.file) return undefined; return { text: editor.getSelection(), file: info.file, from: editor.getCursor('from'), to: editor.getCursor('to') }; }
  captureSelection() {
    const workspace = this.plugin.app.workspace;
    const active = workspace.activeEditor;
    const leaves = workspace.getLeavesOfType('markdown');
    for (const leaf of leaves) {
      const view = leaf.view, selection = view.containerEl.ownerDocument.getSelection();
      if (!selection?.rangeCount || selection.isCollapsed || !view.file) continue;
      const range = selection.getRangeAt(0);
      const preview = view.containerEl.querySelector('.markdown-preview-view');
      if (preview?.contains(range.commonAncestorContainer) && selection.toString().trim()) return { text: selection.toString(), file: view.file };
    }
    const editorView = leaves.map(leaf => leaf.view).find(view => view.editor === active?.editor);
    const snapshot = this.editorSnapshot(active?.editor, editorView || active);
    if (snapshot?.text.trim()) return snapshot;
  }
  async referenceSelection(snapshot = this.captureSelection()) {
    try {
      if (!snapshot) throw new Error('请先在笔记中选中要引用的文字');
      await this.plugin.activateView();
      const view = this.views()[0]; if (!view?.inputEl) throw new Error('Pi 输入框尚未就绪');
      const attachment = selectionAttachment(snapshot, view.composerAttachments);
      if (attachment) view.composerAttachments.push(attachment);
      view.renderComposerImages(); view.setRunningState(view.running); view.inputEl.focus();
    } catch (error) { new Notice(error.message); }
  }
  decorate(view) {
    const root = view.contentEl; if (!root?.querySelector) return;
    if (view.inputEl) view.inputEl.placeholder = '问点什么… Enter 发送，Shift+Enter 换行';
    const bar = view.composerBarEl;
    if (bar && !bar.querySelector('.pi-agent-quote-selection')) {
      const button = bar.createEl('button', { cls: 'clickable-icon pi-agent-quote-selection', attr: { title: '引用所选文字', 'aria-label': '引用所选文字', type: 'button' } });
      setIcon(button, 'quote'); const picker = bar.querySelector('.pi-agent-image-picker');
      if (picker) picker.after(button); else bar.prepend(button);
      let snapshot;
      button.addEventListener('pointerdown', event => { event.preventDefault(); snapshot = this.captureSelection(); });
      button.addEventListener('click', () => { const selected = snapshot || this.captureSelection(); snapshot = undefined; void this.referenceSelection(selected); });
    }
    for (const label of root.querySelectorAll('.pi-agent-context-badge-label')) {
      const attachment = view.composerAttachments.find(item => item.fileName === label.textContent && (item.selectionReference || item.fileName.startsWith('选中文字 · ')));
      if (!attachment || label.dataset.selectionPreview) continue;
      label.dataset.selectionPreview = 'true'; label.tabIndex = 0; label.setAttribute('role', 'button');
      label.title = `查看所选文字 · ${attachment.path}`;
      const preview = () => new SelectionPreviewModal(this.plugin.app, attachment).open();
      label.addEventListener('click', preview);
      label.addEventListener('keydown', event => { if (event.key === 'Enter' || event.key === ' ') { event.preventDefault(); preview(); } });
    }
  }
  renderQuestion(question, body) {
    if (question.message) body.createEl('p', { text: question.message });
    const options = question.options || [], selected = new Set();
    for (const [index, raw] of options.entries()) {
      const option = typeof raw === 'string' ? { label: raw, value: raw } : raw;
      const label = body.createEl('label', { cls: 'pi-agent-question-option' });
      const input = label.createEl('input', { type: question.multiple ? 'checkbox' : 'radio', attr: { name: question.id, 'aria-label': option.label } });
      const text = label.createDiv(); text.createSpan({ text: option.label }); if (option.description) text.createEl('small', { text: option.description });
      input.addEventListener('change', () => { if (!question.multiple) selected.clear(); input.checked ? selected.add(index) : selected.delete(index); updateSubmit(); });
    }
    let custom;
    const allowEmpty = ['input', 'editor'].includes(question.method);
    if (!options.length || question.allowOther) {
      custom = body.createEl('textarea', { cls: 'pi-agent-question-input', attr: { placeholder: question.placeholder || (options.length ? '或者写下你的回答…' : '写下你的回答…'), rows: question.method === 'editor' ? '8' : '3', 'aria-label': '你的回答' } });
      custom.value = question.prefill || ''; custom.addEventListener('input', () => updateSubmit());
    }
    const actions = body.createDiv({ cls: 'pi-agent-question-actions' });
    actions.createEl('button', { text: '取消', cls: 'pi-agent-question-cancel' }).addEventListener('click', () => question.settle({ cancelled: true }));
    const submit = actions.createEl('button', { text: '提交回答', cls: 'mod-cta' });
    const updateSubmit = () => { submit.disabled = !allowEmpty && selected.size === 0 && !custom?.value.trim(); };
    updateSubmit();
    submit.addEventListener('click', () => {
      const answers = [...selected].map(index => typeof options[index] === 'string' ? options[index] : options[index].value ?? options[index].label);
      const other = custom?.value;
      if (other?.trim() || (allowEmpty && !answers.length)) answers.push(other || '');
      if (!answers.length) return;
      const labels = [...selected].map(index => typeof options[index] === 'string' ? options[index] : options[index].label); if (other?.trim()) labels.push(other);
      question.settle({ value: question.multiple ? answers.map(String).join('、') : other?.trim() ? other : answers[0], answers, label: labels.join('、') });
    });
  }
  dispose() { this.disposed = true; this.cancelQuestions(null); this.bridge.dispose(); if (active === this) active = null; }
}

class QuestionModal extends Modal {
  constructor(enhancement, question) { super(enhancement.plugin.app); this.enhancement = enhancement; this.question = question; }
  onOpen() {
    this.modalEl.addClass('pi-agent-question-modal');
    this.titleEl.setText(this.question.title || this.question.question || 'Pi 需要你的回答');
    const body = this.contentEl.createDiv({ cls: 'pi-agent-question-body' });
    this.enhancement.renderQuestion(this.question, body);
    body.querySelector('input,textarea')?.focus();
  }
  onClose() { this.contentEl.empty(); if (!this.question.settled) this.question.settle({ cancelled: true }); }
}
class SelectionPreviewModal extends Modal {
  constructor(app, attachment) { super(app); this.attachment = attachment; }
  onOpen() {
    this.modalEl.addClass('pi-agent-selection-preview'); this.titleEl.setText('引用的所选文字');
    this.contentEl.createEl('p', { cls: 'pi-agent-selection-source', text: this.attachment.path });
    this.contentEl.createEl('pre', { text: this.attachment.content });
  }
  onClose() { this.contentEl.empty(); }
}
