/* AIMock design-only interactions. No APIs, persistent state, authorization or real actions. */
(() => {
  'use strict';

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const shell = $('.shell');
  const sidebarToggle = $('#sidebarToggle');
  const menuTriggers = new Map([
    ['workspaceToggle', 'workspaceMenu'],
    ['accountToggle', 'accountMenu'],
    ['notificationsToggle', 'notificationsMenu'],
    ['periodToggle', 'periodMenu'],
  ]);
  const previewDialog = $('#previewDialog');
  const previewTitle = $('#previewTitle');
  const previewBody = $('#previewBody');
  const searchDialog = $('#searchDialog');
  const searchInput = $('#demoSearchInput');
  const searchResults = $('#searchResults');
  const toast = $('#demoToast');
  let toastTimeout = null;
  let activeMenu = null;
  let space = 'company';

  function notify(message) {
    clearTimeout(toastTimeout);
    toast.textContent = message;
    toast.hidden = false;
    toastTimeout = setTimeout(() => { toast.hidden = true; }, 3400);
  }

  function closeMenu() {
    if (!activeMenu) return;
    const [triggerId, menuId] = activeMenu;
    $('#' + menuId).hidden = true;
    $('#' + triggerId).setAttribute('aria-expanded', 'false');
    activeMenu = null;
  }

  function toggleMenu(triggerId) {
    const menuId = menuTriggers.get(triggerId);
    if (!menuId) return;
    if (activeMenu?.[0] === triggerId) return closeMenu();
    closeMenu();
    const trigger = $('#' + triggerId);
    const menu = $('#' + menuId);
    menu.hidden = false;
    trigger.setAttribute('aria-expanded', 'true');
    const r = trigger.getBoundingClientRect();
    const box = menu.getBoundingClientRect();
    const left = Math.max(12, Math.min(r.left, window.innerWidth - box.width - 12));
    const above = r.top - box.height - 8;
    const top = above >= 12 ? above : Math.min(window.innerHeight - box.height - 12, r.bottom + 8);
    menu.style.left = left + 'px';
    menu.style.top = Math.max(12, top) + 'px';
    activeMenu = [triggerId, menuId];
  }

  function setSpace(kind) {
    space = kind;
    const company = kind === 'company';
    const switcher = $('#workspaceToggle');
    $('strong', switcher).textContent = company ? 'Acme Corp' : 'Личное';
    $('div > span', switcher).textContent = company ? 'Пространство компании' : 'Личное пространство';
    $('.work-icon', switcher).textContent = company ? 'A' : 'Д';
    $('.crumb').firstChild.textContent = company ? 'Acme Corp ' : 'Личное ';
    const team = $$('[data-nav="Команда"]')[0];
    if (team) team.hidden = !company;
    $$('[data-space]').forEach(button => {
      const selected = button.dataset.space === kind;
      button.classList.toggle('is-selected', selected);
      button.setAttribute('aria-checked', String(selected));
    });
    closeMenu();
    notify(company ? 'Показано пространство компании (демо)' : 'Показан вариант личного пространства (данные на экране демонстрационные)');
  }

  function makeRow(primary, secondary, side = '') {
    const row = document.createElement('div');
    row.className = 'dialog-row';
    const content = document.createElement('div');
    const title = document.createElement('strong');
    title.textContent = primary;
    content.append(title);
    if (secondary) {
      const small = document.createElement('small');
      small.textContent = secondary;
      content.append(small);
    }
    row.append(content);
    if (side) {
      const value = document.createElement('span');
      value.className = 'dialog-side';
      value.textContent = side;
      row.append(value);
    }
    return row;
  }

  function openPreview(title, rows, description = '') {
    closeMenu();
    previewTitle.textContent = title;
    previewBody.replaceChildren();
    if (description) {
      const p = document.createElement('p');
      p.style.cssText = 'font-size:12px;color:#aab7b1;padding:7px 0 10px';
      p.textContent = description;
      previewBody.append(p);
    }
    for (const row of rows) previewBody.append(makeRow(row.title, row.subtitle, row.side));
    if (!rows.length) previewBody.append(makeRow('Демонстрационный экран', 'Детальный дизайн этого раздела пока не согласован.'));
    previewDialog.showModal();
  }

  const listing = {
    agents: { title: 'Агенты', selector: '.agent-line', read: el => ({
      title: $('.agent-name', el)?.textContent ?? '',
      subtitle: $('.agent-description', el)?.textContent ?? '',
      side: $('.agent-status', el)?.textContent.trim() ?? ''
    })},
    chats: { title: 'Все диалоги', selector: '.chatline', read: el => ({
      title: $('.chatname', el)?.textContent ?? '',
      subtitle: $('.chatpreview', el)?.textContent ?? '',
      side: $('.chat-time', el)?.textContent ?? ''
    })},
    attention: { title: 'Требуют внимания', selector: '.alertline', read: el => ({
      title: $('.alert-info > div', el)?.textContent ?? '',
      subtitle: $('.alert-info > small', el)?.textContent ?? '',
      side: ''
    })},
    integration: { title: 'Интеграции', selector: '.integration', read: el => ({
      title: $('strong', el)?.textContent ?? '',
      subtitle: $('small', el)?.textContent ?? '',
      side: ''
    })},
    activity: { title: 'Недавняя активность', selector: '.recentitem', read: el => ({
      title: $('strong', el)?.textContent ?? '',
      subtitle: $('small', el)?.textContent ?? '',
      side: $('time', el)?.textContent ?? ''
    })},
  };

  function openCollection(category, selected = null) {
    const data = listing[category];
    if (!data) return;
    const elements = selected ? [selected] : $$(data.selector);
    openPreview(selected ? data.read(selected).title : data.title,
      elements.map(data.read),
      selected ? 'Предпросмотр записи, без изменения её состояния.' : 'Список составлен из данных на странице «Обзор».');
  }

  function openPlaceholder(subject) {
    openPreview(subject, [], 'Раздел пока не реализован как отдельный дизайн-макет.');
  }

  const demoActions = {
    'create-agent': 'Создание агента',
    wallet: 'Пополнение AI-кошелька',
    tariff: 'Управление тарифом',
    spaces: 'Пространства',
    profile: 'Профиль',
    preferences: 'Настройки аккаунта',
    logout: 'Выход из аккаунта',
  };

  function renderSearch() {
    const q = searchInput.value.trim().toLocaleLowerCase('ru-RU');
    searchResults.replaceChildren();
    if (!q) {
      searchResults.append(makeRow('Начните вводить запрос', 'Поиск по агентам, диалогам и событиям.'));
      return;
    }
    let matches = 0;
    for (const cat of ['agents', 'chats', 'attention']) {
      const l = listing[cat];
      for (const el of $$(l.selector)) {
        const data = l.read(el);
        if (![data.title, data.subtitle].join(' ').toLocaleLowerCase('ru-RU').includes(q)) continue;
        const button = document.createElement('button');
        button.type = 'button';
        button.className = 'search-result';
        button.append(makeRow(data.title, `${l.title} · ${data.subtitle}`, data.side));
        button.addEventListener('click', () => {
          searchDialog.close();
          openCollection(cat, el);
        });
        searchResults.append(button);
        matches += 1;
      }
    }
    if (!matches) searchResults.append(makeRow('Ничего не найдено', 'Попробуйте другой запрос.'));
  }

  document.addEventListener('click', e => {
    const button = e.target.closest('button');
    if (button && menuTriggers.has(button.id)) return toggleMenu(button.id);

    if (e.target.closest('#sidebarToggle')) {
      closeMenu();
      const collapsed = shell.classList.toggle('is-collapsed');
      sidebarToggle.setAttribute('aria-expanded', String(!collapsed));
      sidebarToggle.setAttribute('aria-label', collapsed ? 'Развернуть боковое меню' : 'Свернуть боковое меню');
      sidebarToggle.title = collapsed ? 'Развернуть меню' : 'Свернуть меню';
      return;
    }

    if (button?.dataset.space) return setSpace(button.dataset.space);
    if (button?.dataset.period) {
      $('#periodLabel').textContent = button.dataset.period === '7' ? 'За 7 дней' : 'За 30 дней';
      $$('[data-period]').forEach(el => el.classList.toggle('is-selected', el === button));
      closeMenu();
      notify('Период изменён только визуально: показатели являются демонстрационными');
      return;
    }
    if (button?.dataset.show) return openCollection(button.dataset.show);
    if (button?.dataset.demo) return openPlaceholder(demoActions[button.dataset.demo] ?? 'Просмотр');
    if (button?.dataset.nav) {
      const name = button.dataset.nav;
      if (name !== 'Обзор') openPlaceholder(name);
      else closeMenu();
      return;
    }
    if (button?.hasAttribute('data-close-dialog')) {
      button.closest('dialog')?.close();
      return;
    }
    if (e.target.closest('#searchToggle')) {
      closeMenu();
      searchInput.value = '';
      renderSearch();
      searchDialog.showModal();
      searchInput.focus();
      return;
    }

    const item = e.target.closest('[data-preview]');
    if (item) return openCollection(item.dataset.preview === 'agent' ? 'agents' : item.dataset.preview === 'chat' ? 'chats' : item.dataset.preview, item);
    if (activeMenu && !e.target.closest('#' + activeMenu[1])) closeMenu();
  });

  document.addEventListener('keydown', e => {
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      closeMenu();
      searchInput.value = '';
      renderSearch();
      searchDialog.showModal();
      searchInput.focus();
    }
    if (e.key === 'Escape') closeMenu();
    if ((e.key === 'Enter' || e.key === ' ') && e.target.matches('[data-preview]')) {
      e.preventDefault();
      e.target.click();
    }
  });
  searchInput.addEventListener('input', renderSearch);
  for (const dialog of [previewDialog, searchDialog]) {
    dialog.addEventListener('click', e => { if (e.target === dialog) dialog.close(); });
  }
  window.addEventListener('resize', closeMenu);
})();