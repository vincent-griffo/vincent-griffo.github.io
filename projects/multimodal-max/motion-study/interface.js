/* Portfolio presentation adapter. The supplied kinematic solver is unchanged. */
(() => {
  const origin = location.origin;
  const query = new URLSearchParams(location.search);
  const validTheme = value => value === 'light' ? 'light' : 'dark';
  document.documentElement.dataset.theme = validTheme(query.get('theme'));
  let visible = true;
  let resumeWhenVisible = false;
  let initialized = false;

  // The source camera leaves space for its former masthead. Reclaim that space
  // for the rover without changing the model or overriding visitors' orbiting.
  function frameRover() {
    const api = window.__axisReview;
    if (!api?.ready || api.getState().masterTab !== 'rover') return;
    const { camera, controls } = api;
    const scale = camera.aspect < .7 ? .98 : .86;
    const offset = camera.position.clone().sub(controls.target).multiplyScalar(scale);
    controls.target.z -= .12;
    camera.position.copy(controls.target).add(offset);
    camera.lookAt(controls.target);
    controls.update();
  }

  document.addEventListener('click', event => {
    if (event.target.closest('[data-view],[data-mode],[data-master]')) frameRover();
  });
  document.addEventListener('keydown', event => {
    if (event.target.matches('[data-mode],[data-master]') && ['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) frameRover();
  });
  document.querySelector('.master-tabs').addEventListener('keydown', event => {
    if (!['Home','End'].includes(event.key) || !event.target.matches('[data-master]')) return;
    const api = window.__axisReview;
    if (!api?.ready) return;
    event.preventDefault();
    event.stopImmediatePropagation();
    const tabs = [...document.querySelectorAll('[data-master]')];
    const tab = event.key === 'Home' ? tabs[0] : tabs.at(-1);
    api.setMasterTab(tab.dataset.master);
    frameRover();
    tab.focus();
  }, true);

  function applyVisibility(value) {
    visible = value;
    const api = window.__axisReview;
    if (!initialized || !api?.ready) return;
    if (!visible) {
      resumeWhenVisible ||= api.getState().playing;
      api.pause();
    } else if (resumeWhenVisible) {
      resumeWhenVisible = false;
      api.play();
    }
  }
  window.addEventListener('message', event => {
    if (event.origin !== origin || event.source !== parent) return;
    if (event.data?.type === 'max-motion-theme') document.documentElement.dataset.theme = validTheme(event.data.theme);
    if (event.data?.type === 'max-motion-visibility' && typeof event.data.visible === 'boolean') applyVisibility(event.data.visible);
  });
  const started = performance.now();
  const ready = setInterval(() => {
    const api = window.__axisReview;
    if (api?.error || performance.now() - started > 120000) {
      clearInterval(ready);
      if (parent !== window) parent.postMessage({ type:'max-motion-error' }, origin);
      return;
    }
    if (!api?.ready) return;
    clearInterval(ready);
    api.setAllAxes(false);
    api.setMasterTab('rover');
    api.setMode('tracing');
    frameRover();
    for (const id of ['show-world','show-path','show-labels']) {
      const input = document.getElementById(id);
      input.checked = false;
      input.dispatchEvent(new Event('change', { bubbles:true }));
    }
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) api.pause();
    initialized = true;
    applyVisibility(visible);
    document.getElementById('viewport').setAttribute('aria-label','Interactive full-rover and single-leg Multimodal Max model');
    if (parent !== window) parent.postMessage({ type:'max-motion-ready' }, origin);
  }, 100);
})();
