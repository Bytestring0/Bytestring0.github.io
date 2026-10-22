import http from 'node:http';
import crypto from 'node:crypto';
import path from 'node:path';
import { inflateRawSync } from 'node:zlib';

export function vaultPath(input, base) {
  if (typeof input !== 'string' || !input.trim()) throw new Error('请提供仓库内的文件路径');
  let value = input.replace(/\\/g, '/').replace(/^\.\//, '');
  if (path.isAbsolute(value)) value = path.relative(base, value).replace(/\\/g, '/');
  if (value.startsWith('/') || value.split('/').some(part => part === '..') || /:|\0/.test(value) || value.split('/').some(part => part.startsWith('.'))) throw new Error('路径必须位于仓库可见目录中，不能访问隐藏配置');
  return value.replace(/^\.\//, '');
}
export function decodeExport(data) {
  if (!data?.startsWith('data:image/svg+xml')) throw new Error('Draw.io 没有返回 SVG');
  const [header, ...parts] = data.split(','); const content = parts.join(',');
  return header.includes(';base64') ? Buffer.from(content, 'base64').toString('utf8') : decodeURIComponent(content);
}
export class LocalBridge {
  constructor(plugin, ask) { this.plugin = plugin; this.app = plugin.app; this.ask = ask; this.token = crypto.randomBytes(32).toString('hex'); this.serial = Promise.resolve(); this.controllers = new Set(); this.lastDrawing = this.app.workspace?.getActiveFile(); if (plugin.registerEvent && this.app.workspace) plugin.registerEvent(this.app.workspace.on('file-open', file => { if (file && /\.(?:drawio(?:\.svg)?|excalidraw\.md)$/i.test(file.path)) this.lastDrawing = file; })); }
  async start() {
    this.server = http.createServer((req, res) => this.handle(req, res));
    await new Promise((resolve, reject) => { this.server.once('error', reject); this.server.listen(0, '127.0.0.1', resolve); });
    this.environment = { OBSIDIAN_PI_BRIDGE_URL: `http://127.0.0.1:${this.server.address().port}`, OBSIDIAN_PI_BRIDGE_TOKEN: this.token };
  }
  threadForArgs(args) { const index = args.indexOf('--session'); const session = index >= 0 ? args[index + 1] : ''; return this.plugin.listThreads(true).find(thread => thread.piSessionId && session?.includes(thread.piSessionId))?.id || this.plugin.getCurrentThread().id; }
  async handle(req, res) {
    const supplied = String(req.headers.authorization || '').replace(/^Bearer /, '');
    if (Buffer.byteLength(supplied) !== Buffer.byteLength(this.token) || !crypto.timingSafeEqual(Buffer.from(supplied), Buffer.from(this.token))) { res.writeHead(401); res.end('{}'); return; }
    if (req.method !== 'POST' || req.url !== '/tool') { res.writeHead(404); res.end('{}'); return; }
    const controller = new AbortController(); this.controllers.add(controller); res.once('close', () => { if (!res.writableEnded) controller.abort(); });
    try {
      let body = ''; for await (const chunk of req) { body += chunk; if (Buffer.byteLength(body) > 12 * 1024 * 1024) throw new Error('工具输入过大'); }
      const request = JSON.parse(body); const args = request.args || {};
      let result;
      if (request.name === 'question') result = await this.ask({ ...args, title: args.question, signal: controller.signal, threadId: request.threadId });
      else {
        if (!['drawio', 'excalidraw'].includes(request.name)) throw new Error('未知工具');
        const command = request.name === 'excalidraw' ? args.request?.command : args.action;
        const readCommands = request.name === 'excalidraw' ? ['help', 'status', 'schema', 'api', 'list', 'read', 'open', 'skill', 'result'] : ['read', 'open'];
        if (['chat', 'review', 'read-only'].includes(this.plugin.settings.sandboxMode) && !readCommands.includes(command)) throw new Error('当前工具模式不允许修改图纸，请先切换到 Edit 或 Full agent');
        const job = () => controller.signal.aborted ? Promise.reject(new Error('操作已取消')) : request.name === 'drawio' ? this.drawio(args, controller.signal) : this.excalidraw(args, controller.signal);
        result = await (this.serial = this.serial.catch(() => {}).then(job));
      }
      if (!res.destroyed) { res.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify(result)); }
    } catch (error) { if (!res.destroyed) { res.writeHead(400, { 'Content-Type': 'application/json; charset=utf-8' }); res.end(JSON.stringify({ error: error.message })); } }
    finally { this.controllers.delete(controller); }
  }
  async drawingPlugin(id) { let plugin = this.app.plugins.getPlugin(id); if (!plugin) { await this.app.plugins.enablePlugin(id); plugin = this.app.plugins.getPlugin(id); } if (!plugin) throw new Error('所需绘图插件未安装或未启用'); return plugin; }
  filePath(input) { return vaultPath(input, this.plugin.getVaultBasePath()); }
  drawingPath(input, kind, action) { if (input) return this.filePath(input); if (action === 'create') throw new Error('新建图纸时请指定文件名'); const candidates = [this.app.workspace.getActiveFile(), this.lastDrawing]; const file = candidates.find(file => file && (kind === 'drawio' ? /\.drawio(?:\.svg)?$/i : /\.excalidraw\.md$/i).test(file.path) && this.app.vault.getAbstractFileByPath(file.path)); if (!file) throw new Error('请打开对应图纸或明确指定路径'); return this.filePath(file.path); }
  async mtime(file) { return (await this.app.vault.adapter.stat(file.path))?.mtime; }
  async unchanged(file, expected) { if (!Number.isFinite(expected)) throw new Error('修改前请先 read 图纸，传入返回的 expectedMtime'); if (Math.trunc(await this.mtime(file)) !== Math.trunc(expected)) throw new Error('图纸在读取后发生变化，请重新读取后再修改'); }
  async folders(filePath) { const folders = filePath.split('/').slice(0, -1); let current = ''; for (const part of folders) { current = current ? current + '/' + part : part; if (!await this.app.vault.adapter.exists(current)) await this.app.vault.createFolder(current); } }
  async write(filePath, content, existing) { await this.folders(filePath); return existing ? (await this.app.vault.modify(existing, content), existing) : this.app.vault.create(filePath, content); }
  xml(input) {
    const doc = new DOMParser().parseFromString(input, 'text/xml');
    if (doc.querySelector('parsererror') || doc.doctype || !['mxfile', 'mxGraphModel'].includes(doc.documentElement.nodeName)) throw new Error('请提供有效的 mxfile 或 mxGraphModel XML');
    if (doc.documentElement.nodeName === 'mxGraphModel') return `<mxfile><diagram name="Page-1">${input}</diagram></mxfile>`;
    return input;
  }
  async drawio(args, signal) {
    const filePath = this.drawingPath(args.path, 'drawio', args.action); if (!/\.drawio(?:\.svg)?$/i.test(filePath)) throw new Error('Draw.io 路径需以 .drawio.svg 或 .drawio 结尾');
    const file = this.app.vault.getAbstractFileByPath(filePath); const plugin = await this.drawingPlugin('drawio-editor');
    if (args.action === 'read') {
      if (!file) throw new Error('图纸不存在');
      let xml = await this.app.vault.read(file);
      if (filePath.endsWith('.svg')) { const svg = new DOMParser().parseFromString(xml, 'image/svg+xml'); xml = svg.documentElement.getAttribute('content'); if (!xml) throw new Error('此 SVG 不含可编辑的 Draw.io 数据'); }
      const doc = new DOMParser().parseFromString(xml, 'text/xml');
      for (const diagram of doc.querySelectorAll('diagram')) if (!diagram.querySelector('mxGraphModel') && diagram.textContent.trim()) { const decoded = decodeURIComponent(inflateRawSync(Buffer.from(diagram.textContent.trim(), 'base64')).toString('utf8')); const parsed = new DOMParser().parseFromString(decoded, 'text/xml'); diagram.textContent = ''; diagram.appendChild(doc.importNode(parsed.documentElement, true)); }
      return { path: filePath, xml: new XMLSerializer().serializeToString(doc), expectedMtime: await this.mtime(file) };
    }
    if (args.action === 'open') { if (!file) throw new Error('图纸不存在'); await this.openDrawio(plugin, file); return { path: filePath, opened: true }; }
    if (!['create', 'update'].includes(args.action)) throw new Error('未知 Draw.io 操作');
    if (args.action === 'create' && file) throw new Error('文件已存在，请先读取并使用 update');
    if (args.action === 'update') { if (!file) throw new Error('图纸不存在'); await this.unchanged(file, args.expectedMtime); }
    const xml = this.xml(args.xml || '');
    const content = filePath.endsWith('.svg') ? await this.renderDrawio(plugin, xml, signal) : xml;
    if (signal?.aborted) throw new Error('操作已取消');
    if (file) await this.unchanged(file, args.expectedMtime);
    const saved = await this.write(filePath, content, file);
    if (args.open) await this.openDrawio(plugin, saved);
    return { path: filePath, expectedMtime: await this.mtime(saved), editable: true, preview: filePath.endsWith('.svg') ? filePath : undefined };
  }
  async openDrawio(plugin, file) {
    if (!file.path.endsWith('.svg')) return this.app.workspace.getLeaf('tab').openFile(file);
    plugin.openEditor({ title: () => file.basename, read: async () => (await this.drawio({ action: 'read', path: file.path })).xml, exportFormat: () => 'xmlsvg', writeExport: async data => this.app.vault.modify(file, decodeExport(data)), write: async xml => { const document = new DOMParser().parseFromString(await this.app.vault.read(file), 'image/svg+xml'); document.documentElement.setAttribute('content', this.xml(xml)); await this.app.vault.modify(file, new XMLSerializer().serializeToString(document)); } });
  }
  async renderDrawio(plugin, xml, signal) {
    const base = await plugin.resolveBaseUrl(); const url = new URL(base); const origin = url.origin;
    if (!['127.0.0.1', 'localhost'].includes(url.hostname)) throw new Error('请在 Draw.io 插件设置中使用已安装的离线编辑器');
    for (const [key, value] of Object.entries({ embed: '1', proto: 'json', configure: '1', spin: '1', ui: 'min', libraries: '1', dark: '0' })) url.searchParams.set(key, value);
    plugin.server.acquire();
    const frame = document.createElement('iframe'); frame.style.cssText = 'position:fixed;left:-12000px;top:0;width:1200px;height:900px;visibility:hidden';
    try {
      return await new Promise((resolve, reject) => {
        let settled = false;
        const finish = (error, data) => { if (settled) return; settled = true; clearTimeout(timer); window.removeEventListener('message', handle); signal?.removeEventListener('abort', cancel); error ? reject(error) : resolve(data); };
        const cancel = () => finish(new Error('操作已取消'));
        const post = data => frame.contentWindow.postMessage(JSON.stringify(data), origin);
        const handle = event => {
          if (event.source !== frame.contentWindow || event.origin !== origin) return;
          let message; try { message = JSON.parse(event.data); } catch { return; }
          if (message.event === 'configure') post({ action: 'configure', config: { compressXml: false } });
          if (message.event === 'init') post({ action: 'load', xml, autosave: 0, modified: 0 });
          if (message.event === 'load') post({ action: 'export', format: 'xmlsvg', embedImages: true });
          if (message.event === 'export') { try { const svg = decodeExport(message.data); const parsed = new DOMParser().parseFromString(svg, 'image/svg+xml'); if (parsed.querySelector('parsererror') || !parsed.documentElement.getAttribute('content')) throw new Error('SVG 缺少 Draw.io 源数据'); finish(null, svg); } catch (error) { finish(error); } }
        };
        const timer = setTimeout(() => finish(new Error('Draw.io 预览导出超时，未修改文件')), 45000);
        window.addEventListener('message', handle); signal?.addEventListener('abort', cancel, { once: true });
        document.body.appendChild(frame); frame.src = url.href; if (signal?.aborted) cancel();
      });
    } finally { frame.remove(); plugin.server.release(); }
  }
  async excalidraw(args, signal) {
    if (!args.request || typeof args.request !== 'object' || Array.isArray(args.request)) throw new Error('请提供官方 CLI request 对象；先使用 command: help 或 schema 查询参数');
    if (signal?.aborted) throw new Error('操作已取消');
    const plugin = await this.drawingPlugin('obsidian-excalidraw-plugin');
    if (typeof plugin.ea?.executeCLI !== 'function') throw new Error('当前 Excalidraw 不支持官方 CLI，请升级绘图插件');
    // Preserve the native receipt, including partial publication/save failures.
    // The dispatcher owns path validation, revisions, fresh EA instances and saves.
    return plugin.ea.executeCLI({ apiVersion: 1, ...args.request });
  }
  dispose() { for (const controller of this.controllers) controller.abort(); this.server?.close(); this.server?.closeAllConnections(); }
}
