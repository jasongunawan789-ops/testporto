/**
 * Monograph Editorial AI Chat Assistant Client Engine
 * Fully featured ChatGPT-style UI with local thread history,
 * Markdown parsing, streaming link protection, and source extraction.
 */

document.addEventListener('DOMContentLoaded', () => {
  const DEFAULT_KEY = ''; // Kept empty for security to prevent committing keys to git
  const DEFAULT_MODEL = 'deepseek/deepseek-v4-flash';

  // State Management
  let state = {
    apiKey: localStorage.getItem('openrouter_api_key') || '',
    model: localStorage.getItem('openrouter_model') || DEFAULT_MODEL,
    threads: JSON.parse(localStorage.getItem('chat_history_threads') || '[]'),
    activeThreadId: null,
    isGenerating: false,
    currentReader: null,
    useBackend: false
  };

  // --- UI BINDINGS ---
  const sidebar = document.getElementById('sidebar');
  const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
  const btnCloseSidebarMobile = document.getElementById('btn-close-sidebar-mobile');
  const btnNewChat = document.getElementById('btn-new-chat');
  const chatHistoryList = document.getElementById('chat-history-list');
  const btnSettings = document.getElementById('btn-settings');
  const btnThemeToggle = document.getElementById('btn-theme-toggle');
  const themeBtnText = btnThemeToggle.querySelector('.theme-btn-text');
  
  const currentModelBadge = document.getElementById('current-model-badge');
  const btnClearChat = document.getElementById('btn-clear-chat');
  const chatMessages = document.getElementById('chat-messages');
  const emptyState = document.getElementById('empty-state');
  
  const composerForm = document.getElementById('composer-form');
  const composerInput = document.getElementById('composer-input');
  const btnSubmitMessage = document.getElementById('btn-submit-message');
  const btnAttach = document.getElementById('btn-attach');
  const btnWebSearch = document.getElementById('btn-web-search');
  
  const settingsModal = document.getElementById('settings-modal');
  const btnCloseSettings = document.getElementById('btn-close-settings');
  const btnSaveSettings = document.getElementById('btn-save-settings');
  const btnResetSettings = document.getElementById('btn-reset-settings');
  const settingsApiKey = document.getElementById('settings-api-key');
  const btnToggleKeyVisibility = document.getElementById('btn-toggle-key-visibility');
  const settingsModel = document.getElementById('settings-model');

  // Check Backend Server Configuration Status
  async function checkBackend() {
    try {
      const response = await fetch('/api/config');
      if (response.ok) {
        const config = await response.json();
        if (config.has_api_key) {
          state.useBackend = true;
          state.model = config.model;
          currentModelBadge.textContent = config.model;
          
          // Show visual indicator that server credentials are used
          btnSettings.innerHTML = `
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="2" y="2" width="20" height="8" rx="2" ry="2"></rect>
              <rect x="2" y="14" width="20" height="8" rx="2" ry="2"></rect>
              <line x1="6" y1="6" x2="6.01" y2="6"></line>
              <line x1="6" y1="18" x2="6.01" y2="18"></line>
            </svg>
            Server Active
          `;
          
          const warningMsg = document.getElementById('key-required-msg');
          if (warningMsg) warningMsg.remove();
        } else {
          state.useBackend = false;
        }
      }
    } catch (e) {
      state.useBackend = false;
    }
  }

  checkBackend();

  // --- THEME INITIALIZATION ---
  const savedTheme = localStorage.getItem('chat_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeButtonUI(savedTheme);

  // Initialize Badge and archives list
  currentModelBadge.textContent = state.model;
  renderThreadsList();

  // Load last active conversation or launch a new workspace
  const lastActiveId = localStorage.getItem('last_active_thread_id');
  if (lastActiveId && state.threads.some(t => t.id === lastActiveId)) {
    loadThread(lastActiveId);
  } else {
    initNewChat();
  }

  // API Key validation warning trigger
  if (!state.apiKey && !state.useBackend) {
    setTimeout(() => {
      openSettings();
      const modalMsg = document.createElement('p');
      modalMsg.id = 'key-required-msg';
      modalMsg.style.color = 'hsl(0, 65%, 50%)';
      modalMsg.style.fontSize = '12px';
      modalMsg.style.fontWeight = '700';
      modalMsg.style.marginTop = '-12px';
      modalMsg.style.marginBottom = '16px';
      modalMsg.style.fontFamily = 'Hanken Grotesk, sans-serif';
      modalMsg.textContent = 'OPENROUTER API KEY REQUIRED TO INITIATE CONVERSATION.';
      
      const keyGroup = settingsModal.querySelector('.settings-group');
      if (keyGroup && !document.getElementById('key-required-msg')) {
        keyGroup.insertBefore(modalMsg, keyGroup.firstChild);
      }
    }, 500);
  }

  // --- INTERACTION CONTROLS ---

  btnToggleSidebar.addEventListener('click', () => {
    sidebar.classList.toggle('hidden');
    sidebar.classList.toggle('active');
  });

  if (btnCloseSidebarMobile) {
    btnCloseSidebarMobile.addEventListener('click', () => {
      sidebar.classList.remove('active');
      sidebar.classList.add('hidden');
    });
  }

  btnNewChat.addEventListener('click', () => {
    initNewChat();
    if (window.innerWidth <= 992) {
      sidebar.classList.remove('active');
      sidebar.classList.add('hidden');
    }
  });

  btnClearChat.addEventListener('click', () => {
    if (state.activeThreadId) {
      if (confirm('Clear all conversation messages in this archive?')) {
        const thread = state.threads.find(t => t.id === state.activeThreadId);
        if (thread) {
          thread.messages = [];
          thread.title = 'New Conversation';
          saveThreadsToStorage();
          renderThreadsList();
          loadThread(state.activeThreadId);
        }
      }
    }
  });

  btnThemeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('chat_theme', newTheme);
    updateThemeButtonUI(newTheme);
  });

  function openSettings() {
    settingsApiKey.value = state.apiKey;
    settingsModel.value = state.model;
    settingsApiKey.type = 'password';
    btnToggleKeyVisibility.textContent = 'Show';
    settingsModal.classList.add('active');
    settingsModal.setAttribute('aria-hidden', 'false');
  }

  btnSettings.addEventListener('click', openSettings);

  function closeSettings() {
    settingsModal.classList.remove('active');
    settingsModal.setAttribute('aria-hidden', 'true');
  }

  btnCloseSettings.addEventListener('click', closeSettings);
  
  settingsModal.addEventListener('click', (e) => {
    if (e.target === settingsModal) closeSettings();
  });

  btnToggleKeyVisibility.addEventListener('click', () => {
    if (settingsApiKey.type === 'password') {
      settingsApiKey.type = 'text';
      btnToggleKeyVisibility.textContent = 'Hide';
    } else {
      settingsApiKey.type = 'password';
      btnToggleKeyVisibility.textContent = 'Show';
    }
  });

  btnSaveSettings.addEventListener('click', () => {
    const newKey = settingsApiKey.value.trim();
    const newModel = settingsModel.value;
    
    if (!newKey && !state.useBackend) {
      alert('API key cannot be empty. Please enter an OpenRouter key.');
      return;
    }

    state.apiKey = newKey;
    state.model = newModel;
    localStorage.setItem('openrouter_api_key', newKey);
    localStorage.setItem('openrouter_model', newModel);
    
    currentModelBadge.textContent = newModel;
    
    const warningMsg = document.getElementById('key-required-msg');
    if (warningMsg) warningMsg.remove();
    
    closeSettings();
    showTemporarySystemAlert('System settings committed.');
  });

  btnResetSettings.addEventListener('click', () => {
    if (confirm('Restore default model config?')) {
      settingsApiKey.value = DEFAULT_KEY;
      settingsModel.value = DEFAULT_MODEL;
    }
  });

  composerInput.addEventListener('input', () => {
    composerInput.style.height = 'auto';
    composerInput.style.height = (composerInput.scrollHeight) + 'px';
  });

  composerInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      composerForm.dispatchEvent(new Event('submit'));
    }
  });

  composerForm.addEventListener('submit', (e) => {
    e.preventDefault();
    if (state.isGenerating) return;

    const text = composerInput.value.trim();
    if (!text) return;

    composerInput.value = '';
    composerInput.style.height = 'auto';
    
    handleUserSubmission(text);
  });

  document.querySelectorAll('.suggestion-card').forEach(card => {
    card.addEventListener('click', () => {
      const prompt = card.getAttribute('data-prompt');
      if (prompt && !state.isGenerating) {
        handleUserSubmission(prompt);
      }
    });
  });

  btnAttach.addEventListener('click', () => {
    alert('Local file attachments are visual references. File parsing is simulated.');
  });

  btnWebSearch.addEventListener('click', () => {
    btnWebSearch.classList.toggle('active');
    const active = btnWebSearch.classList.contains('active');
    showTemporarySystemAlert(active ? 'Web search enabled.' : 'Web search disabled.');
  });

  // --- STATE PERSISTENCE HELPERS ---

  function updateThemeButtonUI(theme) {
    if (theme === 'dark') {
      themeBtnText.textContent = 'Light Mode';
      btnThemeToggle.querySelector('svg').innerHTML = `
        <circle cx="12" cy="12" r="5"></circle>
        <line x1="12" y1="1" x2="12" y2="3"></line>
        <line x1="12" y1="21" x2="12" y2="23"></line>
        <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line>
        <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line>
        <line x1="1" y1="12" x2="3" y2="12"></line>
        <line x1="21" y1="12" x2="23" y2="12"></line>
        <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line>
        <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line>
      `;
    } else {
      themeBtnText.textContent = 'Dark Mode';
      btnThemeToggle.querySelector('svg').innerHTML = `
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path>
      `;
    }
  }

  function showTemporarySystemAlert(text) {
    const alertEl = document.createElement('div');
    alertEl.style.position = 'fixed';
    alertEl.style.bottom = '100px';
    alertEl.style.left = '50%';
    alertEl.style.transform = 'translateX(-50%)';
    alertEl.style.backgroundColor = 'var(--primary)';
    alertEl.style.color = 'var(--on-primary)';
    alertEl.style.padding = '8px 16px';
    alertEl.style.fontSize = '11px';
    alertEl.style.fontWeight = '700';
    alertEl.style.fontFamily = 'Hanken Grotesk, sans-serif';
    alertEl.style.zIndex = '999';
    alertEl.style.border = '1px solid var(--outline)';
    alertEl.textContent = text.toUpperCase();
    
    document.body.appendChild(alertEl);
    setTimeout(() => {
      alertEl.style.opacity = '0';
      alertEl.style.transition = 'opacity 0.4s ease';
      setTimeout(() => alertEl.remove(), 400);
    }, 1500);
  }

  function initNewChat() {
    const id = 'thread_' + Date.now();
    const newThread = {
      id: id,
      title: 'New Conversation',
      model: state.model,
      messages: []
    };
    
    state.threads.unshift(newThread);
    state.activeThreadId = id;
    
    saveThreadsToStorage();
    renderThreadsList();
    loadThread(id);
  }

  function loadThread(id) {
    state.activeThreadId = id;
    localStorage.setItem('last_active_thread_id', id);
    
    const thread = state.threads.find(t => t.id === id);
    if (!thread) return;

    document.querySelectorAll('.history-item-wrap').forEach(el => {
      if (el.getAttribute('data-id') === id) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    chatMessages.innerHTML = '';
    
    if (thread.messages.length === 0) {
      emptyState.style.display = 'flex';
      btnClearChat.style.display = 'none';
    } else {
      emptyState.style.display = 'none';
      btnClearChat.style.display = 'flex';
      
      thread.messages.forEach(msg => {
        appendMessageUI(msg.role, msg.content, msg.timestamp);
      });
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }

  function deleteThread(id, event) {
    if (event) event.stopPropagation();
    
    if (confirm('Delete this conversation history thread?')) {
      const index = state.threads.findIndex(t => t.id === id);
      if (index !== -1) {
        state.threads.splice(index, 1);
        saveThreadsToStorage();
        renderThreadsList();
        
        if (state.activeThreadId === id) {
          if (state.threads.length > 0) {
            loadThread(state.threads[0].id);
          } else {
            initNewChat();
          }
        }
      }
    }
  }

  function saveThreadsToStorage() {
    localStorage.setItem('chat_history_threads', JSON.stringify(state.threads));
  }

  function renderThreadsList() {
    chatHistoryList.innerHTML = '';
    
    if (state.threads.length === 0) {
      const emptyLi = document.createElement('li');
      emptyLi.className = 'label-caps';
      emptyLi.style.padding = '0 20px';
      emptyLi.style.color = 'var(--secondary)';
      emptyLi.textContent = 'No archives found.';
      chatHistoryList.appendChild(emptyLi);
      return;
    }

    state.threads.forEach(thread => {
      const li = document.createElement('li');
      li.className = `history-item-wrap ${thread.id === state.activeThreadId ? 'active' : ''}`;
      li.setAttribute('data-id', thread.id);
      
      const btnItem = document.createElement('button');
      btnItem.className = 'btn-history-item';
      btnItem.textContent = thread.title;
      btnItem.title = thread.title;
      btnItem.addEventListener('click', () => loadThread(thread.id));
      
      const btnDelete = document.createElement('button');
      btnDelete.className = 'btn-history-delete';
      btnDelete.ariaLabel = 'Delete thread';
      btnDelete.innerHTML = `
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <polyline points="3 6 5 6 21 6"></polyline>
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
        </svg>
      `;
      btnDelete.addEventListener('click', (e) => deleteThread(thread.id, e));
      
      li.appendChild(btnItem);
      li.appendChild(btnDelete);
      chatHistoryList.appendChild(li);
    });
  }

  function appendMessageUI(role, content, timestamp) {
    emptyState.style.display = 'none';
    btnClearChat.style.display = 'flex';

    const row = document.createElement('div');
    row.className = `message-row ${role}`;
    
    const formattedTime = timestamp || new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const author = role === 'user' ? 'USER' : 'ASSISTANT';

    row.innerHTML = `
      <div class="message-content-wrapper">
        <div class="message-meta">
          <span class="author-label label-caps">${author}</span>
          <span>${formattedTime}</span>
        </div>
        <div class="message-card">
          <div class="message-text">${role === 'user' ? escapeHTML(content) : renderMarkdown(content)}</div>
        </div>
      </div>
    `;

    chatMessages.appendChild(row);
    return row;
  }

  // --- MARKDOWN ENGINE ---

  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function parseTableBlock(block) {
    const lines = block.trim().split('\n');
    if (lines.length < 2) return null;
    
    const sepLine = lines[1].trim();
    if (!/^\|?\s*[:\-]+\s*\|[\s:\-\|]*$/.test(sepLine)) return null;
    
    const alignMatches = sepLine.split('|').map(col => {
      const trimmed = col.trim();
      if (!trimmed) return null;
      const left = trimmed.startsWith(':');
      const right = trimmed.endsWith(':');
      if (left && right) return 'center';
      if (right) return 'right';
      return 'left';
    }).filter(x => x !== null);
    
    let tableHtml = '<table><thead><tr>';
    
    const headers = lines[0].split('|').map(c => c.trim()).filter((c, i, a) => {
      if (i === 0 && c === '') return false;
      if (i === a.length - 1 && c === '') return false;
      return true;
    });
    
    headers.forEach((h, idx) => {
      const align = alignMatches[idx] || 'left';
      tableHtml += `<th style="text-align: ${align}">${h}</th>`;
    });
    tableHtml += '</tr></thead><tbody>';
    
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const cells = line.split('|').map(c => c.trim()).filter((c, idx, a) => {
        if (idx === 0 && c === '') return false;
        if (idx === a.length - 1 && c === '') return false;
        return true;
      });
      
      tableHtml += '<tr>';
      cells.forEach((cell, idx) => {
        const align = alignMatches[idx] || 'left';
        tableHtml += `<td style="text-align: ${align}">${cell}</td>`;
      });
      if (cells.length < headers.length) {
        for (let k = cells.length; k < headers.length; k++) {
          const align = alignMatches[k] || 'left';
          tableHtml += `<td style="text-align: ${align}"></td>`;
        }
      }
      tableHtml += '</tr>';
    }
    tableHtml += '</tbody></table>';
    return tableHtml;
  }

  function renderMarkdown(md) {
    if (!md) return '';

    let html = md;
    
    // 1. Temporary placeholder for code blocks to prevent nested parsing
    const codeBlocks = [];
    html = html.replace(/```(\w*)\n([\s\S]*?)(```|$)/g, (match, lang, code) => {
      const index = codeBlocks.length;
      const displayLang = (lang || 'code').toUpperCase();
      const escapedCode = escapeHTML(code.trim());
      
      codeBlocks.push(`
        <div class="code-block-wrapper">
          <div class="code-block-header">
            <span class="code-lang-label">${displayLang}</span>
            <button class="btn-code-copy" onclick="copyCodeContent(this)">Copy code</button>
          </div>
          <pre class="code-block-pre"><code>${escapedCode}</code></pre>
        </div>
      `);
      return `__CODE_BLOCK_PLACEHOLDER_${index}__`;
    });

    // 1.5 Extract sources/citations (excluding code blocks)
    const sources = [];
    const seenUrls = new Set();
    
    // Scan for complete links [text](url)
    const completeLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g;
    let linkMatch;
    completeLinkRegex.lastIndex = 0;
    while ((linkMatch = completeLinkRegex.exec(html)) !== null) {
      const text = linkMatch[1].trim();
      const url = linkMatch[2].trim();
      if (url && !seenUrls.has(url)) {
        seenUrls.add(url);
        sources.push({ text, url });
      }
    }
    
    // Scan for streaming incomplete links [text](url...
    const incompleteLinkRegex = /\[([^\]]+)\]\((https?:\/\/[^)\s]*)$/g;
    let incMatch;
    incompleteLinkRegex.lastIndex = 0;
    while ((incMatch = incompleteLinkRegex.exec(html)) !== null) {
      const text = incMatch[1].trim();
      const url = incMatch[2].trim();
      if (url && !seenUrls.has(url)) {
        seenUrls.add(url);
        sources.push({ text, url });
      }
    }

    // Build Sources Section HTML
    let sourcesHtml = '';
    if (sources.length > 0) {
      sourcesHtml = `
        <div class="message-sources-wrapper">
          <div class="sources-title label-caps">Sources</div>
          <div class="sources-list">
      `;
      
      sources.forEach((source, index) => {
        let displayTitle = source.text;
        const cleanTitle = displayTitle.replace(/[\[\]]/g, '').trim();
        const isNumerical = /^\d+$/.test(cleanTitle);
        
        if (isNumerical) {
          try {
            const parsedUrl = new URL(source.url);
            displayTitle = parsedUrl.hostname.replace(/^www\./, '');
          } catch (e) {
            displayTitle = 'Source';
          }
        }
        
        sourcesHtml += `
          <a href="${escapeHTML(source.url)}" target="_blank" rel="noopener noreferrer" class="source-item">
            <span class="source-num">[${index + 1}]</span>
            <span class="source-text">${escapeHTML(displayTitle)}</span>
            <svg class="source-arrow-icon" width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
              <line x1="7" y1="17" x2="17" y2="7"></line>
              <polyline points="7 7 17 7 17 17"></polyline>
            </svg>
          </a>
        `;
      });
      
      sourcesHtml += `
          </div>
        </div>
      `;
    }

    // 2. Escape other general HTML before rendering markdown formatting
    html = escapeHTML(html);

    // 3. Inline code blocks `code`
    html = html.replace(/`([^`]+)`/g, '<code>$1</code>');

    // 4. Strong Bold **text**
    html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // 5. Italic *text*
    html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');

    // 6. Blockquotes
    html = html.replace(/^\s*&gt;\s+(.+)$/gm, '<blockquote>$1</blockquote>');

    // 7. Parse Headings (from H3 to H1)
    html = html.replace(/^\s*###\s+(.+)$/gm, '<h3>$1</h3>');
    html = html.replace(/^\s*##\s+(.+)$/gm, '<h2>$1</h2>');
    html = html.replace(/^\s*#\s+(.+)$/gm, '<h1>$1</h1>');

    // 8. Horizontal Rules
    html = html.replace(/^\s*[-*_]{3,}\s*$/gm, '<hr>');

    // 9. Links [text](url) (Complete)
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, text, url) => {
      const cleanText = text.trim();
      if (/^\d+$/.test(cleanText)) {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">[${cleanText}]</a>`;
      }
      if (/^\[\d+\]$/.test(cleanText)) {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">${cleanText}</a>`;
      }
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    });

    // 9.5 Handle incomplete markdown links during streaming to prevent raw URL exposure
    html = html.replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]*)$/g, (match, text, url) => {
      const cleanText = text.trim();
      if (/^\d+$/.test(cleanText)) {
        return `<a href="${url}" target="_blank" rel="noopener noreferrer">[${cleanText}]</a>`;
      }
      return `<a href="${url}" target="_blank" rel="noopener noreferrer">${text}</a>`;
    });

    // 10. Strike-through ~~text~~
    html = html.replace(/~~([^~]+)~~/g, '<del>$1</del>');

    // 11. Unordered lists (- item or * item)
    html = html.replace(/(?:^\s*(?:-|\*)\s+(.+)\n?)+/gm, (match) => {
      const items = match.trim().split('\n').map(line => {
        const itemContent = line.replace(/^\s*(?:-|\*)\s+/, '');
        return `<li>${itemContent}</li>`;
      }).join('');
      return `<ul>${items}</ul>`;
    });

    // 12. Ordered lists (1. item)
    html = html.replace(/(?:^\s*\d+\.\s+(.+)\n?)+/gm, (match) => {
      const items = match.trim().split('\n').map(line => {
        const itemContent = line.replace(/^\s*\d+\.\s+/, '');
        return `<li>${itemContent}</li>`;
      }).join('');
      return `<ol>${items}</ol>`;
    });

    // 13. Process Paragraphs (split by double newlines, wrap in <p>)
    const blocks = html.split(/\n\n+/);
    html = blocks.map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      
      if (trimmed.startsWith('__CODE_BLOCK_PLACEHOLDER_') || 
          trimmed.startsWith('<ul>') || 
          trimmed.startsWith('<ol>') || 
          trimmed.startsWith('<blockquote>') ||
          trimmed.startsWith('<h1>') ||
          trimmed.startsWith('<h2>') ||
          trimmed.startsWith('<h3>') ||
          trimmed.startsWith('<hr>')) {
        return trimmed;
      }
      
      const tableHtml = parseTableBlock(trimmed);
      if (tableHtml) return tableHtml;
      
      return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
    }).join('');

    // 14. Restore code blocks
    codeBlocks.forEach((blockHtml, index) => {
      html = html.replace(`__CODE_BLOCK_PLACEHOLDER_${index}__`, blockHtml);
    });

    return html + sourcesHtml;
  }

  // --- API SSE STREAMING HANDLER ---

  async function handleUserSubmission(messageText) {
    if (state.isGenerating) return;

    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const thread = state.threads.find(t => t.id === state.activeThreadId);
    if (!thread) return;

    if (thread.messages.length === 0) {
      thread.title = messageText.length > 30 ? messageText.substring(0, 30) + '...' : messageText;
    }

    const userMessage = {
      role: 'user',
      content: messageText,
      timestamp: timestamp
    };
    thread.messages.push(userMessage);
    saveThreadsToStorage();
    renderThreadsList();

    appendMessageUI('user', messageText, timestamp);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    state.isGenerating = true;
    btnSubmitMessage.disabled = true;
    composerInput.placeholder = 'Generating response...';

    const assistantRow = document.createElement('div');
    assistantRow.className = 'message-row assistant';
    assistantRow.innerHTML = `
      <div class="message-content-wrapper">
        <div class="message-meta">
          <span class="author-label label-caps">ASSISTANT</span>
          <span class="assistant-timestamp">--:--</span>
        </div>
        <div class="message-card">
          <div class="message-text">
            <div class="typing-indicator" aria-label="Assistant is thinking">
              <div class="typing-dot"></div>
              <div class="typing-dot"></div>
              <div class="typing-dot"></div>
            </div>
          </div>
        </div>
      </div>
    `;
    chatMessages.appendChild(assistantRow);
    chatMessages.scrollTop = chatMessages.scrollHeight;

    const assistantTextContainer = assistantRow.querySelector('.message-text');
    const assistantTimestampEl = assistantRow.querySelector('.assistant-timestamp');

    const historyLimit = 15;
    const historyMessages = thread.messages
      .slice(-historyLimit)
      .map(m => ({ role: m.role, content: m.content }));

    try {
      const searchActive = btnWebSearch.classList.contains('active');
      if (searchActive) {
        const lastMsg = historyMessages[historyMessages.length - 1];
        lastMsg.content = `[Web Search Context: Simulated active search queries completed.]\n\n${lastMsg.content}`;
      }

      let response;
      if (state.useBackend) {
        response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: historyMessages })
        });
      } else {
        response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${state.apiKey}`,
            'HTTP-Referer': window.location.origin,
            'X-Title': 'Jason Gunawan Portfolio AI Engine'
          },
          body: JSON.stringify({
            model: state.model,
            messages: historyMessages,
            stream: true
          })
        });
      }

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `HTTP Error ${response.status}`);
      }

      const reader = response.body.getReader();
      state.currentReader = reader;
      const decoder = new TextDecoder('utf-8');
      
      let assistantResponseText = '';
      let isFirstChunk = true;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value);
        const lines = chunkText.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || !trimmed.startsWith('data:')) continue;
          
          const dataContent = trimmed.substring(5).trim();
          if (dataContent === '[DONE]') break;

          try {
            const parsed = JSON.parse(dataContent);
            const token = parsed.choices[0]?.delta?.content || '';
            
            if (token) {
              if (isFirstChunk) {
                assistantTextContainer.innerHTML = '';
                assistantTextContainer.classList.add('streaming-cursor');
                assistantTimestampEl.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                isFirstChunk = false;
              }
              
              assistantResponseText += token;
              assistantTextContainer.innerHTML = renderMarkdown(assistantResponseText);
              chatMessages.scrollTop = chatMessages.scrollHeight;
            }
          } catch (e) {
            // Ignore stream fragment parsing errors
          }
        }
      }

      assistantTextContainer.classList.remove('streaming-cursor');
      
      const finalTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      thread.messages.push({
        role: 'assistant',
        content: assistantResponseText,
        timestamp: finalTimestamp
      });
      saveThreadsToStorage();

    } catch (error) {
      console.error(error);
      assistantTextContainer.innerHTML = `
        <div style="border: 1px solid hsl(0, 65%, 50%); background-color: hsla(0, 65%, 50%, 0.05); padding: 16px; margin: 8px 0;">
          <h4 class="label-caps" style="color: hsl(0, 65%, 50%); margin-bottom: 8px; font-weight: 800;">System Connection Failure</h4>
          <p class="body-md" style="font-size: 13px; margin: 0; color: var(--on-surface);">
            Failed to stream completion token channels. Details: ${error.message}
          </p>
          <p class="label-caps" style="margin-top: 12px; font-size: 10px; cursor: pointer; text-decoration: underline;" onclick="document.getElementById('btn-settings').click()">
            Configure System Settings
          </p>
        </div>
      `;
      assistantTimestampEl.textContent = '--:--';
    } finally {
      state.isGenerating = false;
      state.currentReader = null;
      btnSubmitMessage.disabled = false;
      composerInput.placeholder = 'Message Assistant Engine...';
      chatMessages.scrollTop = chatMessages.scrollHeight;
    }
  }
});

// --- GLOBAL UTILITIES ---

window.copyCodeContent = function(button) {
  const codeBlock = button.closest('.code-block-wrapper').querySelector('code');
  if (!codeBlock) return;

  const rawCode = codeBlock.textContent;

  navigator.clipboard.writeText(rawCode).then(() => {
    const originalText = button.textContent;
    button.textContent = 'COPIED!';
    button.style.color = '#fff';
    
    setTimeout(() => {
      button.textContent = originalText;
      button.style.color = '';
    }, 2000);
  }).catch(err => {
    console.error('Failed to copy code: ', err);
  });
};
