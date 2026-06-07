/**
 * AI Chat Assistant Engine (ChatGPT Clone)
 * Built for Jason Gunawan's Portfolio
 */

document.addEventListener('DOMContentLoaded', () => {
  const DEFAULT_KEY = ''; // Kept empty for security to prevent committing keys to git
  const DEFAULT_MODEL = 'google/gemma-4-31b-it:free';

  // Initialize credentials in localStorage if DEFAULT_KEY is defined
  if (!localStorage.getItem('openrouter_api_key') && DEFAULT_KEY) {
    localStorage.setItem('openrouter_api_key', DEFAULT_KEY);
  }
  
  const savedModel = localStorage.getItem('openrouter_model');
  if (!savedModel || savedModel === 'sourceful/riverflow-v2.5-pro:free') {
    localStorage.setItem('openrouter_model', DEFAULT_MODEL);
  }

  // Core State
  let state = {
    apiKey: localStorage.getItem('openrouter_api_key'),
    model: localStorage.getItem('openrouter_model'),
    threads: JSON.parse(localStorage.getItem('chat_history_threads') || '[]'),
    activeThreadId: null,
    isGenerating: false,
    currentReader: null // Keep reference to abort stream if needed
  };

  // --- UI ELEMENTS ---
  const sidebar = document.getElementById('sidebar');
  const btnToggleSidebar = document.getElementById('btn-toggle-sidebar');
  const btnCloseSidebarMobile = document.getElementById('btn-close-sidebar-mobile');
  const btnNewChat = document.getElementById('btn-new-chat');
  const chatHistoryList = document.getElementById('chat-history-list');
  const btnSettings = document.getElementById('btn-settings');
  const btnQuickSettings = document.getElementById('btn-quick-settings');
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

  // --- THEME INITIALIZATION ---
  const savedTheme = localStorage.getItem('chat_theme') || 'light';
  document.documentElement.setAttribute('data-theme', savedTheme);
  updateThemeButtonUI(savedTheme);

  // Initialize model badge text
  currentModelBadge.textContent = state.model;

  // Render initial threads
  renderThreadsList();

  // Load last active thread or start a new one
  const lastActiveId = localStorage.getItem('last_active_thread_id');
  if (lastActiveId && state.threads.some(t => t.id === lastActiveId)) {
    loadThread(lastActiveId);
  } else {
    initNewChat();
  }

  // Check if API Key exists, if not, open settings modal automatically
  if (!localStorage.getItem('openrouter_api_key')) {
    setTimeout(() => {
      openSettings();
      // Show helper message in the settings modal
      const modalMsg = document.createElement('p');
      modalMsg.id = 'key-required-msg';
      modalMsg.style.color = '#d32f2f';
      modalMsg.style.fontSize = '12px';
      modalMsg.style.fontWeight = '600';
      modalMsg.style.marginTop = '-12px';
      modalMsg.style.marginBottom = '16px';
      modalMsg.style.fontFamily = 'Hanken Grotesk, sans-serif';
      modalMsg.textContent = 'OPENROUTER API KEY REQUIRED TO INITIATE CHAT.';
      
      const keyGroup = settingsModal.querySelector('.settings-group');
      if (keyGroup && !document.getElementById('key-required-msg')) {
        keyGroup.insertBefore(modalMsg, keyGroup.firstChild);
      }
    }, 500);
  }

  // --- EVENT LISTENERS ---

  // Sidebar Controls
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
    // Close sidebar on mobile after clicking new chat
    if (window.innerWidth <= 992) {
      sidebar.classList.remove('active');
      sidebar.classList.add('hidden');
    }
  });

  btnClearChat.addEventListener('click', () => {
    if (state.activeThreadId) {
      if (confirm('Are you sure you want to reset this chat thread? This clears all messages.')) {
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

  // Theme Toggle
  btnThemeToggle.addEventListener('click', () => {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = currentTheme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('chat_theme', newTheme);
    updateThemeButtonUI(newTheme);
  });

  // Settings Modal Controls
  const openSettings = () => {
    settingsApiKey.value = state.apiKey;
    settingsModel.value = state.model;
    settingsApiKey.type = 'password';
    btnToggleKeyVisibility.textContent = 'Show';
    settingsModal.classList.add('active');
    settingsModal.setAttribute('aria-hidden', 'false');
  };

  btnSettings.addEventListener('click', openSettings);
  btnQuickSettings.addEventListener('click', openSettings);

  const closeSettings = () => {
    settingsModal.classList.remove('active');
    settingsModal.setAttribute('aria-hidden', 'true');
  };

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
    
    if (!newKey) {
      alert('API key cannot be empty. Please enter a valid OpenRouter key.');
      return;
    }

    state.apiKey = newKey;
    state.model = newModel;
    localStorage.setItem('openrouter_api_key', newKey);
    localStorage.setItem('openrouter_model', newModel);
    
    currentModelBadge.textContent = newModel;
    
    // Remove warning message if it exists
    const warningMsg = document.getElementById('key-required-msg');
    if (warningMsg) warningMsg.remove();
    
    closeSettings();
    
    // Notify user of update
    showTemporarySystemAlert('System settings committed successfully.');
  });

  btnResetSettings.addEventListener('click', () => {
    if (confirm('Are you sure you want to restore default credentials?')) {
      settingsApiKey.value = DEFAULT_KEY;
      settingsModel.value = DEFAULT_MODEL;
    }
  });

  // Composer Input Controls
  composerInput.addEventListener('input', () => {
    autoGrowTextarea(composerInput);
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

    const messageText = composerInput.value.trim();
    if (!messageText) return;

    composerInput.value = '';
    composerInput.style.height = 'auto'; // Reset height
    
    handleUserSubmission(messageText);
  });

  // Suggestion Cards Clicking
  document.querySelectorAll('.suggestion-card').forEach(card => {
    card.addEventListener('click', () => {
      const prompt = card.getAttribute('data-prompt');
      if (prompt && !state.isGenerating) {
        handleUserSubmission(prompt);
      }
    });
  });

  // Mock Toolbar buttons feedback
  btnAttach.addEventListener('click', () => {
    alert('File attachments are visual design references. File parsing is simulated in this sandbox environment.');
  });

  btnWebSearch.addEventListener('click', () => {
    btnWebSearch.classList.toggle('active');
    const isActive = btnWebSearch.classList.contains('active');
    btnWebSearch.style.color = isActive ? 'var(--primary)' : '';
    btnWebSearch.style.backgroundColor = isActive ? 'var(--surface-container-high)' : '';
    showTemporarySystemAlert(isActive ? 'Web search tool enabled.' : 'Web search tool disabled.');
  });

  // --- CORE UTILITY FUNCTIONS ---

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

  function autoGrowTextarea(element) {
    element.style.height = 'auto';
    element.style.height = (element.scrollHeight) + 'px';
  }

  function showTemporarySystemAlert(text) {
    const alertEl = document.createElement('div');
    alertEl.style.position = 'fixed';
    alertEl.style.bottom = '100px';
    alertEl.style.left = '50%';
    alertEl.style.transform = 'translateX(-50%)';
    alertEl.style.backgroundColor = 'var(--inverse-surface)';
    alertEl.style.color = 'var(--inverse-on-surface)';
    alertEl.style.padding = '8px 16px';
    alertEl.style.fontSize = '12px';
    alertEl.style.fontWeight = '600';
    alertEl.style.fontFamily = 'Hanken Grotesk, sans-serif';
    alertEl.style.zIndex = '999';
    alertEl.style.border = '1px solid var(--outline)';
    alertEl.textContent = text.toUpperCase();
    
    document.body.appendChild(alertEl);
    setTimeout(() => {
      alertEl.style.opacity = '0';
      alertEl.style.transition = 'opacity 0.5s ease';
      setTimeout(() => alertEl.remove(), 500);
    }, 2000);
  }

  // --- CONVERSATION ENGINE ---

  function initNewChat() {
    const newId = 'thread_' + Date.now();
    const newThread = {
      id: newId,
      title: 'New Conversation',
      model: state.model,
      messages: []
    };
    
    state.threads.unshift(newThread);
    state.activeThreadId = newId;
    
    saveThreadsToStorage();
    renderThreadsList();
    loadThread(newId);
  }

  function loadThread(id) {
    state.activeThreadId = id;
    localStorage.setItem('last_active_thread_id', id);
    
    const thread = state.threads.find(t => t.id === id);
    if (!thread) return;

    // Update active class in sidebar history
    document.querySelectorAll('.history-item-wrap').forEach(el => {
      if (el.getAttribute('data-id') === id) {
        el.classList.add('active');
      } else {
        el.classList.remove('active');
      }
    });

    // Clear feed
    chatMessages.innerHTML = '';
    
    // Toggle Empty State view
    if (thread.messages.length === 0) {
      emptyState.style.display = 'flex';
      btnClearChat.style.display = 'none';
    } else {
      emptyState.style.display = 'none';
      btnClearChat.style.display = 'flex';
      
      // Render existing messages
      thread.messages.forEach(msg => {
        appendMessageUI(msg.role, msg.content, msg.timestamp);
      });
      
      // Scroll to bottom
      scrollToBottom();
    }
  }

  function deleteThread(id, event) {
    if (event) event.stopPropagation();
    
    if (confirm('Delete this conversation history?')) {
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
      emptyLi.className = 'metadata';
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
      btnDelete.ariaLabel = 'Delete history';
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

  function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
  }

  // --- MARKDOWN COMPILER ---

  function escapeHTML(str) {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  function renderMarkdown(md) {
    if (!md) return '';

    let html = md;
    
    // 1. Temporary placeholder for code blocks to prevent nested parsing
    const codeBlocks = [];
    
    // Match code blocks (with or without language)
    html = html.replace(/```(\w*)\n([\s\S]*?)(```|$)/g, (match, lang, code) => {
      const index = codeBlocks.length;
      const displayLang = (lang || 'code').toUpperCase();
      const escapedCode = escapeHTML(code.trim());
      
      // Store complete custom block layout
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

    // 7. Unordered lists (- item or * item)
    // Wrap consecutive bullet lines in <ul>
    html = html.replace(/(?:^\s*(?:-|\*)\s+(.+)\n?)+/gm, (match) => {
      const items = match.trim().split('\n').map(line => {
        const itemContent = line.replace(/^\s*(?:-|\*)\s+/, '');
        return `<li>${itemContent}</li>`;
      }).join('');
      return `<ul>${items}</ul>`;
    });

    // 8. Ordered lists (1. item)
    html = html.replace(/(?:^\s*\d+\.\s+(.+)\n?)+/gm, (match) => {
      const items = match.trim().split('\n').map(line => {
        const itemContent = line.replace(/^\s*\d+\.\s+/, '');
        return `<li>${itemContent}</li>`;
      }).join('');
      return `<ol>${items}</ol>`;
    });

    // 9. Process Paragraphs (split by double newlines, wrap in <p>)
    const blocks = html.split(/\n\n+/);
    html = blocks.map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';
      
      // If it contains a code block placeholder or list tags, don't wrap in <p>
      if (trimmed.startsWith('__CODE_BLOCK_PLACEHOLDER_') || 
          trimmed.startsWith('<ul>') || 
          trimmed.startsWith('<ol>') || 
          trimmed.startsWith('<blockquote>')) {
        return trimmed;
      }
      return `<p>${trimmed.replace(/\n/g, '<br>')}</p>`;
    }).join('');

    // 10. Restore code blocks
    codeBlocks.forEach((blockHtml, index) => {
      html = html.replace(`__CODE_BLOCK_PLACEHOLDER_${index}__`, blockHtml);
    });

    return html;
  }

  // --- API CONNECTION (SSE STREAMING) ---

  async function handleUserSubmission(messageText) {
    if (state.isGenerating) return;

    // Create timestamp
    const now = new Date();
    const timestamp = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Update active thread state
    const thread = state.threads.find(t => t.id === state.activeThreadId);
    if (!thread) return;

    // Auto update thread title if it's the first message
    if (thread.messages.length === 0) {
      // Set title as the first 30 chars of prompt
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

    // Render user card in feed
    appendMessageUI('user', messageText, timestamp);
    scrollToBottom();

    // Lock UI input
    state.isGenerating = true;
    btnSubmitMessage.disabled = true;
    composerInput.placeholder = 'Generating response...';

    // Add assistant row with temporary loading animation
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
    scrollToBottom();

    const assistantTextContainer = assistantRow.querySelector('.message-text');
    const assistantTimestampEl = assistantRow.querySelector('.assistant-timestamp');

    // Build payload messages history (up to last 15 messages for context limit)
    const historyLimit = 15;
    const historyMessages = thread.messages
      .slice(-historyLimit)
      .map(m => ({ role: m.role, content: m.content }));

    // Execute streaming completion
    try {
      // Append web search context if the toggle is enabled
      const searchActive = btnWebSearch.classList.contains('active');
      if (searchActive) {
        // Simulation of web search contextual lookup addition
        const lastMsg = historyMessages[historyMessages.length - 1];
        lastMsg.content = `[Web Search Context: Simulated active search queries completed.]\n\n${lastMsg.content}`;
      }

      const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
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

      if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        throw new Error(errJson.error?.message || `HTTP Error ${response.status}`);
      }

      // Read SSE stream
      const reader = response.body.getReader();
      state.currentReader = reader;
      const decoder = new TextDecoder('utf-8');
      
      let assistantResponseText = '';
      let isFirstChunk = true;

      // Stream parsing loop
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
                // Clear loading typing dot indicator
                assistantTextContainer.innerHTML = '';
                assistantTextContainer.classList.add('streaming-cursor');
                assistantTimestampEl.textContent = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                isFirstChunk = false;
              }
              
              assistantResponseText += token;
              // Render partial markdown safely
              assistantTextContainer.innerHTML = renderMarkdown(assistantResponseText);
              scrollToBottom();
            }
          } catch (e) {
            // Silence JSON parse errors of incomplete SSE chunks
          }
        }
      }

      // Stream successfully completed
      assistantTextContainer.classList.remove('streaming-cursor');
      
      // Save assistant message to thread
      const finalTimestamp = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      thread.messages.push({
        role: 'assistant',
        content: assistantResponseText,
        timestamp: finalTimestamp
      });
      saveThreadsToStorage();

    } catch (error) {
      console.error(error);
      
      // Render clean, visual error notification inside the conversation card
      assistantTextContainer.innerHTML = `
        <div style="border: 1px solid #d32f2f; background-color: rgba(211, 47, 47, 0.05); padding: 16px; margin: 8px 0;">
          <h4 class="label-caps" style="color: #d32f2f; margin-bottom: 8px; font-weight: 800;">System Connection Failure</h4>
          <p class="body-md" style="font-size: 13px; margin: 0; color: var(--on-surface);">
            Failed to stream completion token channels. Details: ${error.message}
          </p>
          <p class="metadata" style="margin-top: 12px; font-size: 11px;">
            Please check your network connectivity or update your OpenRouter API key credentials in the <span style="text-decoration: underline; cursor: pointer;" onclick="document.getElementById('btn-settings').click()">System Settings</span>.
          </p>
        </div>
      `;
      assistantTimestampEl.textContent = '--:--';
    } finally {
      // Release generation locks
      state.isGenerating = false;
      state.currentReader = null;
      btnSubmitMessage.disabled = false;
      composerInput.placeholder = 'Message Assistant Engine...';
      scrollToBottom();
    }
  }
});

// --- GLOBAL CODE BLOCK ACTIONS ---
// Expose functions globally for dynamic onclick handlers in code headers

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
    console.error('Failed to copy code text: ', err);
  });
};
