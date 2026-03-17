import { describe, it, expect } from 'vitest';
import { render, act } from '@testing-library/react';
import { createContext, useContext, useEffect, useRef, type ReactNode } from 'react';
import { ContextCollector, ContextCollectorContext, ParentLayerContext } from '../providers/ContextCollector.js';
import { AppContext } from '../providers/AppContext.js';
import { UserContext } from '../providers/UserContext.js';
import { SessionContext } from '../providers/SessionContext.js';
import { PagesContext } from '../providers/PagesContext.js';
import { PageContext } from '../providers/PageContext.js';
import { WidgetContext } from '../providers/WidgetContext.js';
import type { ContextCollectorValue } from '../providers/ContextCollector.js';
import type { ContextSnapshot } from '@mychat/shared';

// Helper to capture the collector value from inside the tree
function SnapshotCapture({ onCapture }: { onCapture: (snap: ContextSnapshot) => void }) {
  const collector = useContext(ContextCollectorContext);
  const captured = useRef(false);
  useEffect(() => {
    if (collector && !captured.current) {
      captured.current = true;
      // Defer to next tick so all layers have registered
      setTimeout(() => onCapture(collector.getSnapshot()), 0);
    }
  }, [collector, onCapture]);
  return null;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('ContextCollector', () => {
  it('returns empty layers when no context components are rendered', async () => {
    let snapshot: ContextSnapshot | null = null;

    render(
      <ContextCollector>
        <SnapshotCapture onCapture={s => { snapshot = s; }} />
      </ContextCollector>,
    );

    await act(() => new Promise(r => setTimeout(r, 10)));
    expect(snapshot).not.toBeNull();
    expect(snapshot!.layers).toEqual([]);
    expect(snapshot!.collectedAt).toBeTruthy();
  });

  it('getSnapshot returns only root layers (no duplicates)', async () => {
    let snapshot: ContextSnapshot | null = null;

    render(
      <ContextCollector>
        <PageContext id="page-1" name="Page" data={{ x: 1 }}>
          <WidgetContext id="widget-1" name="Widget" data={{ y: 2 }}>
            <div />
          </WidgetContext>
        </PageContext>
        <SnapshotCapture onCapture={s => { snapshot = s; }} />
      </ContextCollector>,
    );

    await act(() => new Promise(r => setTimeout(r, 10)));
    expect(snapshot).not.toBeNull();
    // Only the page should be at root level
    expect(snapshot!.layers).toHaveLength(1);
    expect(snapshot!.layers[0]!.id).toBe('page-1');
    // Widget should be nested as a child
    expect(snapshot!.layers[0]!.children).toHaveLength(1);
    expect(snapshot!.layers[0]!.children![0]!.id).toBe('widget-1');
  });
});

describe('AppContext', () => {
  it('registers a layer with type "app"', async () => {
    let snapshot: ContextSnapshot | null = null;

    render(
      <ContextCollector>
        <AppContext id="my-app" name="My App" data={{ version: '1.0' }}>
          <SnapshotCapture onCapture={s => { snapshot = s; }} />
        </AppContext>
      </ContextCollector>,
    );

    await act(() => new Promise(r => setTimeout(r, 10)));
    expect(snapshot!.layers).toHaveLength(1);
    expect(snapshot!.layers[0]).toMatchObject({
      type: 'app',
      id: 'my-app',
      name: 'My App',
      data: { version: '1.0' },
    });
  });
});

describe('UserContext', () => {
  it('registers as child of AppContext', async () => {
    let snapshot: ContextSnapshot | null = null;

    render(
      <ContextCollector>
        <AppContext id="app" name="App" data={{}}>
          <UserContext id="user" name="John" data={{ role: 'admin' }}>
            <SnapshotCapture onCapture={s => { snapshot = s; }} />
          </UserContext>
        </AppContext>
      </ContextCollector>,
    );

    await act(() => new Promise(r => setTimeout(r, 10)));
    expect(snapshot!.layers).toHaveLength(1);
    const app = snapshot!.layers[0]!;
    expect(app.type).toBe('app');
    expect(app.children).toHaveLength(1);
    expect(app.children![0]).toMatchObject({
      type: 'user',
      id: 'user',
      name: 'John',
      data: { role: 'admin' },
    });
  });
});

describe('SessionContext', () => {
  it('registers as child of UserContext', async () => {
    let snapshot: ContextSnapshot | null = null;

    render(
      <ContextCollector>
        <AppContext id="app" name="App" data={{}}>
          <UserContext id="user" name="User" data={{}}>
            <SessionContext id="sess" name="Session" data={{ theme: 'dark' }}>
              <SnapshotCapture onCapture={s => { snapshot = s; }} />
            </SessionContext>
          </UserContext>
        </AppContext>
      </ContextCollector>,
    );

    await act(() => new Promise(r => setTimeout(r, 10)));
    const app = snapshot!.layers[0]!;
    const user = app.children![0]!;
    expect(user.children).toHaveLength(1);
    expect(user.children![0]).toMatchObject({
      type: 'session',
      id: 'sess',
      data: { theme: 'dark' },
    });
  });
});

describe('PagesContext', () => {
  it('registers as child of SessionContext', async () => {
    let snapshot: ContextSnapshot | null = null;

    render(
      <ContextCollector>
        <SessionContext id="sess" name="Session" data={{}}>
          <PagesContext id="pages" name="Pages" data={{ activePage: 'home' }}>
            <SnapshotCapture onCapture={s => { snapshot = s; }} />
          </PagesContext>
        </SessionContext>
      </ContextCollector>,
    );

    await act(() => new Promise(r => setTimeout(r, 10)));
    const session = snapshot!.layers[0]!;
    expect(session.type).toBe('session');
    expect(session.children).toHaveLength(1);
    expect(session.children![0]).toMatchObject({
      type: 'pages',
      id: 'pages',
      data: { activePage: 'home' },
    });
  });

  it('contains multiple PageContext children', async () => {
    let snapshot: ContextSnapshot | null = null;

    render(
      <ContextCollector>
        <PagesContext id="pages" name="Pages" data={{ layout: 'tabs' }}>
          <PageContext id="page-a" name="Page A" data={{ tab: 1 }}>
            <div />
          </PageContext>
          <PageContext id="page-b" name="Page B" data={{ tab: 2 }}>
            <div />
          </PageContext>
          <SnapshotCapture onCapture={s => { snapshot = s; }} />
        </PagesContext>
      </ContextCollector>,
    );

    await act(() => new Promise(r => setTimeout(r, 10)));
    expect(snapshot!.layers).toHaveLength(1);
    const pages = snapshot!.layers[0]!;
    expect(pages.type).toBe('pages');
    expect(pages.children).toHaveLength(2);
    expect(pages.children![0]!.id).toBe('page-a');
    expect(pages.children![1]!.id).toBe('page-b');
  });
});

describe('Full hierarchy', () => {
  it('builds the complete tree: App → User → Session → Pages → Page → Widget', async () => {
    let snapshot: ContextSnapshot | null = null;

    render(
      <ContextCollector>
        <AppContext id="app" name="App" data={{ version: '1.0' }}>
          <UserContext id="user" name="Alice" data={{ role: 'manager' }}>
            <SessionContext id="sess" name="Session" data={{ started: '2026-03-17' }}>
              <PagesContext id="pages" name="Pages" data={{ activePage: 'dashboard' }}>
                <PageContext id="dashboard" name="Dashboard" data={{ quarter: 'Q1' }}>
                  <WidgetContext id="chart" name="Revenue Chart" data={{ total: 100000 }}>
                    <div />
                  </WidgetContext>
                  <WidgetContext id="table" name="Clients Table" data={{ count: 5 }}>
                    <div />
                  </WidgetContext>
                </PageContext>
              </PagesContext>
            </SessionContext>
          </UserContext>
        </AppContext>
        <SnapshotCapture onCapture={s => { snapshot = s; }} />
      </ContextCollector>,
    );

    await act(() => new Promise(r => setTimeout(r, 10)));

    // Only root layer at top
    expect(snapshot!.layers).toHaveLength(1);
    const app = snapshot!.layers[0]!;
    expect(app.type).toBe('app');
    expect(app.id).toBe('app');

    // App → User
    expect(app.children).toHaveLength(1);
    const user = app.children![0]!;
    expect(user.type).toBe('user');

    // User → Session
    expect(user.children).toHaveLength(1);
    const session = user.children![0]!;
    expect(session.type).toBe('session');

    // Session → Pages
    expect(session.children).toHaveLength(1);
    const pages = session.children![0]!;
    expect(pages.type).toBe('pages');
    expect(pages.data).toEqual({ activePage: 'dashboard' });

    // Pages → Page
    expect(pages.children).toHaveLength(1);
    const page = pages.children![0]!;
    expect(page.type).toBe('page');
    expect(page.id).toBe('dashboard');

    // Page → Widgets
    expect(page.children).toHaveLength(2);
    expect(page.children![0]).toMatchObject({ type: 'widget', id: 'chart', data: { total: 100000 } });
    expect(page.children![1]).toMatchObject({ type: 'widget', id: 'table', data: { count: 5 } });
  });

  it('supports multiple pages inside PagesContext', async () => {
    let snapshot: ContextSnapshot | null = null;

    render(
      <ContextCollector>
        <AppContext id="app" name="App" data={{}}>
          <UserContext id="user" name="User" data={{}}>
            <SessionContext id="sess" name="Session" data={{}}>
              <PagesContext id="pages" name="Pages" data={{ layout: 'split-view' }}>
                <PageContext id="left-page" name="Left Page" data={{ content: 'editor' }}>
                  <WidgetContext id="editor-widget" name="Code Editor" data={{ language: 'typescript' }}>
                    <div />
                  </WidgetContext>
                </PageContext>
                <PageContext id="right-page" name="Right Page" data={{ content: 'preview' }}>
                  <WidgetContext id="preview-widget" name="Live Preview" data={{ url: '/preview' }}>
                    <div />
                  </WidgetContext>
                </PageContext>
              </PagesContext>
            </SessionContext>
          </UserContext>
        </AppContext>
        <SnapshotCapture onCapture={s => { snapshot = s; }} />
      </ContextCollector>,
    );

    await act(() => new Promise(r => setTimeout(r, 10)));

    const app = snapshot!.layers[0]!;
    const pages = app.children![0]!.children![0]!.children![0]!;
    expect(pages.type).toBe('pages');
    expect(pages.children).toHaveLength(2);

    const leftPage = pages.children![0]!;
    expect(leftPage.id).toBe('left-page');
    expect(leftPage.children).toHaveLength(1);
    expect(leftPage.children![0]!.id).toBe('editor-widget');

    const rightPage = pages.children![1]!;
    expect(rightPage.id).toBe('right-page');
    expect(rightPage.children).toHaveLength(1);
    expect(rightPage.children![0]!.id).toBe('preview-widget');
  });
});

describe('Partial hierarchy', () => {
  it('PageContext works without parent (backward compatible)', async () => {
    let snapshot: ContextSnapshot | null = null;

    render(
      <ContextCollector>
        <PageContext id="standalone" name="Standalone Page" data={{ x: 1 }}>
          <WidgetContext id="w1" name="Widget" data={{ y: 2 }}>
            <div />
          </WidgetContext>
        </PageContext>
        <SnapshotCapture onCapture={s => { snapshot = s; }} />
      </ContextCollector>,
    );

    await act(() => new Promise(r => setTimeout(r, 10)));
    expect(snapshot!.layers).toHaveLength(1);
    expect(snapshot!.layers[0]!.type).toBe('page');
    expect(snapshot!.layers[0]!.children).toHaveLength(1);
  });

  it('WidgetContext works without PageContext parent', async () => {
    let snapshot: ContextSnapshot | null = null;

    render(
      <ContextCollector>
        <WidgetContext id="orphan" name="Orphan Widget" data={{ z: 3 }}>
          <div />
        </WidgetContext>
        <SnapshotCapture onCapture={s => { snapshot = s; }} />
      </ContextCollector>,
    );

    await act(() => new Promise(r => setTimeout(r, 10)));
    expect(snapshot!.layers).toHaveLength(1);
    expect(snapshot!.layers[0]).toMatchObject({
      type: 'widget',
      id: 'orphan',
    });
  });

  it('can skip levels (e.g. AppContext → PageContext without User/Session)', async () => {
    let snapshot: ContextSnapshot | null = null;

    render(
      <ContextCollector>
        <AppContext id="app" name="App" data={{}}>
          <PageContext id="page" name="Page" data={{}}>
            <WidgetContext id="w" name="W" data={{}}>
              <div />
            </WidgetContext>
          </PageContext>
        </AppContext>
        <SnapshotCapture onCapture={s => { snapshot = s; }} />
      </ContextCollector>,
    );

    await act(() => new Promise(r => setTimeout(r, 10)));
    expect(snapshot!.layers).toHaveLength(1);
    const app = snapshot!.layers[0]!;
    expect(app.type).toBe('app');
    expect(app.children).toHaveLength(1);
    expect(app.children![0]!.type).toBe('page');
    expect(app.children![0]!.children).toHaveLength(1);
    expect(app.children![0]!.children![0]!.type).toBe('widget');
  });
});

describe('Unregister cleanup', () => {
  it('removes layer and cleans up parent children on unmount', async () => {
    let snapshot: ContextSnapshot | null = null;
    let collector: ContextCollectorValue | null = null;

    function CollectorCapture() {
      collector = useContext(ContextCollectorContext);
      return null;
    }

    const { unmount } = render(
      <ContextCollector>
        <PageContext id="page" name="Page" data={{}}>
          <WidgetContext id="widget" name="Widget" data={{}}>
            <div />
          </WidgetContext>
        </PageContext>
        <CollectorCapture />
      </ContextCollector>,
    );

    await act(() => new Promise(r => setTimeout(r, 10)));

    // Before unmount: page with widget child
    snapshot = collector!.getSnapshot();
    expect(snapshot.layers).toHaveLength(1);
    expect(snapshot.layers[0]!.children).toHaveLength(1);

    // Unmount everything
    unmount();

    // After unmount: empty
    snapshot = collector!.getSnapshot();
    expect(snapshot.layers).toHaveLength(0);
  });
});

describe('Description field', () => {
  it('passes description through the hierarchy', async () => {
    let snapshot: ContextSnapshot | null = null;

    render(
      <ContextCollector>
        <AppContext id="app" name="App" description="Main application" data={{}}>
          <PageContext id="page" name="Page" description="Dashboard page" data={{}}>
            <WidgetContext id="widget" name="Widget" description="Revenue widget" data={{}}>
              <div />
            </WidgetContext>
          </PageContext>
        </AppContext>
        <SnapshotCapture onCapture={s => { snapshot = s; }} />
      </ContextCollector>,
    );

    await act(() => new Promise(r => setTimeout(r, 10)));
    const app = snapshot!.layers[0]!;
    expect(app.description).toBe('Main application');
    expect(app.children![0]!.description).toBe('Dashboard page');
    expect(app.children![0]!.children![0]!.description).toBe('Revenue widget');
  });
});
