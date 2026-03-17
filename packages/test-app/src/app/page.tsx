'use client';

import { useState } from 'react';
import {
  ChatProvider,
  ChatBubble,
  ChatWidget,
  AppContext,
  UserContext,
  SessionContext,
  PagesContext,
  PageContext,
  WidgetContext,
} from '@mychat/client';
import '@mychat/client/styles.css';
import type { MyChatClientConfig } from '@mychat/shared';

const chatConfig: MyChatClientConfig = {
  serverUrl: '/api/chat',
  mode: 'bubble',
  bubblePosition: 'bottom-right',
  labels: {
    placeholder: 'Ask about this dashboard...',
    sendButton: 'Send',
    newSession: 'New conversation',
    sessions: 'Conversations',
    thinking: 'Analyzing...',
  },
};

// Fake data
const REVENUE_DATA = {
  'Q1-2026': { months: ['Jan', 'Feb', 'Mar'], values: [120000, 135000, 142000], total: 397000 },
  'Q4-2025': { months: ['Oct', 'Nov', 'Dec'], values: [98000, 115000, 128000], total: 341000 },
};

const PIPELINE_DATA = [
  { stage: 'Prospect', count: 45, value: 890000 },
  { stage: 'Qualification', count: 23, value: 560000 },
  { stage: 'Proposal', count: 12, value: 340000 },
  { stage: 'Negotiation', count: 8, value: 210000 },
  { stage: 'Closed Won', count: 5, value: 175000 },
];

const TOP_CLIENTS = [
  { name: 'Acme Corp', revenue: 85000, deals: 3, status: 'Active' },
  { name: 'TechStart SAS', revenue: 62000, deals: 2, status: 'Active' },
  { name: 'Global Industries', revenue: 45000, deals: 1, status: 'Pending' },
  { name: 'Nexus Digital', revenue: 38000, deals: 2, status: 'Active' },
  { name: 'Eco Solutions', revenue: 28000, deals: 1, status: 'At Risk' },
];

type Quarter = keyof typeof REVENUE_DATA;

type ChatMode = 'bubble' | 'widget';

export default function DashboardPage() {
  const [quarter, setQuarter] = useState<Quarter>('Q1-2026');
  const [chatMode, setChatMode] = useState<ChatMode>('bubble');
  const revenue = REVENUE_DATA[quarter];
  const maxRevenue = Math.max(...revenue.values);

  return (
    <ChatProvider config={chatConfig}>
      <AppContext
        id="mychat-test-app"
        name="myChat Test App"
        description="Application de démonstration pour la bibliothèque myChat"
        data={{ version: '0.1.0', environment: 'development' }}
      >
        <UserContext
          id="current-user"
          name="Test User"
          description="Utilisateur de test avec un rôle de responsable commercial"
          data={{ role: 'sales-manager', locale: 'fr-FR' }}
        >
          <SessionContext
            id="dashboard-session"
            name="Dashboard Session"
            description="Session de consultation du tableau de bord commercial"
            data={{ startedAt: new Date().toISOString(), theme: 'light' }}
          >
            <PagesContext
              id="main-pages"
              name="Active Pages"
              description="Pages actuellement affichées dans l'application"
              data={{ activePage: 'sales-dashboard', layout: 'single' }}
            >
              <PageContext
                id="sales-dashboard"
                name="Sales Dashboard"
                description="Vue d'ensemble des performances commerciales. Affiche le CA, le pipeline de ventes et les meilleurs clients."
                data={{ currentQuarter: quarter }}
              >
                <div className="dashboard">
                  <h1>Sales Dashboard</h1>
                  <p>Test dashboard for myChat context-aware AI assistant</p>

                  <div className="filter-bar">
                    <select value={quarter} onChange={e => setQuarter(e.target.value as Quarter)}>
                      <option value="Q1-2026">Q1 2026</option>
                      <option value="Q4-2025">Q4 2025</option>
                    </select>
                    <select value={chatMode} onChange={e => setChatMode(e.target.value as ChatMode)}>
                      <option value="bubble">Chat: Bubble</option>
                      <option value="widget">Chat: Widget</option>
                    </select>
                  </div>

                  <div className="widget-grid">
                    {/* Revenue Widget */}
                    <WidgetContext
                      id="revenue-chart"
                      name="Revenue Chart"
                      description="Graphique du chiffre d'affaires mensuel pour la période sélectionnée"
                      data={{
                        period: quarter,
                        months: revenue.months,
                        values: revenue.values,
                        total: revenue.total,
                        currency: 'EUR',
                        trend: quarter === 'Q1-2026' ? '+16.4%' : null,
                      }}
                    >
                      <div className="widget">
                        <h2>Revenue</h2>
                        <div>
                          <span className="value">
                            {revenue.total.toLocaleString('fr-FR')} &euro;
                          </span>
                          {quarter === 'Q1-2026' && (
                            <span className="trend up">+16.4%</span>
                          )}
                        </div>
                        <div className="subtitle">{quarter}</div>
                        <div className="bar-chart">
                          {revenue.months.map((month, i) => (
                            <div key={month} style={{ flex: 1 }}>
                              <div
                                className="bar"
                                style={{ height: `${(revenue.values[i]! / maxRevenue) * 100}%` }}
                              />
                              <div className="bar-label">{month}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </WidgetContext>

                    {/* Pipeline Widget */}
                    <WidgetContext
                      id="sales-pipeline"
                      name="Sales Pipeline"
                      description="Funnel des opportunités commerciales par étape"
                      data={{
                        stages: PIPELINE_DATA,
                        totalOpportunities: PIPELINE_DATA.reduce((s, p) => s + p.count, 0),
                        totalValue: PIPELINE_DATA.reduce((s, p) => s + p.value, 0),
                        currency: 'EUR',
                      }}
                    >
                      <div className="widget">
                        <h2>Pipeline</h2>
                        <div>
                          <span className="value">
                            {PIPELINE_DATA.reduce((s, p) => s + p.value, 0).toLocaleString('fr-FR')} &euro;
                          </span>
                        </div>
                        <div className="subtitle">
                          {PIPELINE_DATA.reduce((s, p) => s + p.count, 0)} opportunities
                        </div>
                        <div className="bar-chart">
                          {PIPELINE_DATA.map(stage => (
                            <div key={stage.stage} style={{ flex: 1 }}>
                              <div
                                className="bar"
                                style={{
                                  height: `${(stage.count / 45) * 100}%`,
                                  background: stage.stage === 'Closed Won' ? '#16a34a' : undefined,
                                }}
                              />
                              <div className="bar-label">{stage.stage.split(' ')[0]}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </WidgetContext>

                    {/* Top Clients Widget */}
                    <WidgetContext
                      id="top-clients"
                      name="Top Clients"
                      description="Tableau des 5 meilleurs clients par chiffre d'affaires"
                      data={{
                        clients: TOP_CLIENTS,
                        period: quarter,
                      }}
                    >
                      <div className="widget table-widget" style={{ gridColumn: 'span 2' }}>
                        <h2>Top Clients</h2>
                        <table>
                          <thead>
                            <tr>
                              <th>Client</th>
                              <th>Revenue</th>
                              <th>Deals</th>
                              <th>Status</th>
                            </tr>
                          </thead>
                          <tbody>
                            {TOP_CLIENTS.map(client => (
                              <tr key={client.name}>
                                <td>{client.name}</td>
                                <td>{client.revenue.toLocaleString('fr-FR')} &euro;</td>
                                <td>{client.deals}</td>
                                <td>
                                  <span
                                    className={`trend ${client.status === 'At Risk' ? 'down' : 'up'}`}
                                  >
                                    {client.status}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </WidgetContext>
                    {/* Inline widget mode */}
                    {chatMode === 'widget' && (
                      <div className="widget" style={{ gridColumn: 'span 2' }}>
                        <h2>AI Assistant</h2>
                        <ChatWidget height="400px" />
                      </div>
                    )}
                  </div>
                </div>
              </PageContext>
            </PagesContext>
          </SessionContext>
        </UserContext>
      </AppContext>

      {/* Chat bubble — only shown in bubble mode */}
      {chatMode === 'bubble' && <ChatBubble />}
    </ChatProvider>
  );
}
