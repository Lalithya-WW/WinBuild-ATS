import React, { useState, useEffect } from 'react';
import './AnalyticsDashboard.css';

const AnalyticsDashboard = ({ onBack }) => {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const response = await fetch('http://localhost:5000/api/analytics');
      const data = await response.json();
      if (data.success) {
        setAnalytics(data.analytics);
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading analytics...</div>;
  }

  const timeToHireTrend = analytics?.timeToHireTrend || [
    { month: 'Jul', days: 45 },
    { month: 'Aug', days: 38 },
    { month: 'Sep', days: 35 },
    { month: 'Oct', days: 30 },
    { month: 'Nov', days: 27 },
    { month: 'Dec', days: 25 }
  ];

  const sourceEffectiveness = analytics?.sourceEffectiveness || [
    { source: 'LinkedIn', value: 35, color: '#2563eb' },
    { source: 'Indeed', value: 25, color: '#dc2626' },
    { source: 'Referrals', value: 20, color: '#10b981' },
    { source: 'Company Website', value: 15, color: '#f59e0b' },
    { source: 'Job Boards', value: 5, color: '#8b5cf6' }
  ];

  const funnelData = analytics?.funnelData || [
    { stage: 'Applied', count: 250, percentage: 100 },
    { stage: 'Screening', count: 125, percentage: 50 },
    { stage: 'Interviewed', count: 50, percentage: 20 },
    { stage: 'Offered', count: 30, percentage: 12 },
    { stage: 'Hired', count: 25, percentage: 10 }
  ];

  const diversityMetrics = analytics?.diversityMetrics || {
    gender: [
      { label: 'Male', value: 55 },
      { label: 'Female', value: 42 },
      { label: 'Other/Prefer not to say', value: 3 }
    ],
    ethnicity: [
      { label: 'Asian', value: 30 },
      { label: 'White', value: 35 },
      { label: 'Hispanic/Latino', value: 20 },
      { label: 'Black/African American', value: 15 }
    ]
  };

  const maxFunnelCount = Math.max(...funnelData.map(d => d.count));

  return (
    <div className="analytics-dashboard-container">
      <div className="analytics-header">
        {onBack && (
          <button className="back-button" onClick={onBack}>
            ← Back
          </button>
        )}
        <div className="header-content">
          <div className="header-icon">📊</div>
          <div>
            <h1>Analytics Dashboard</h1>
            <p>Recruitment insights and business metrics</p>
          </div>
        </div>
        <div className="date-filter">
          📅 Last 6 months
        </div>
      </div>

      {/* Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-icon time">⏱️</div>
          <div className="metric-info">
            <div className="metric-label">Average Time to Hire</div>
            <div className="metric-value">{analytics?.timeToHire || 25} days</div>
            <div className="metric-change positive">
              From application to offer acceptance
            </div>
          </div>
          <div className="badge badge-success">-40%</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon conversion">🎯</div>
          <div className="metric-info">
            <div className="metric-label">Overall Conversion Rate</div>
            <div className="metric-value">{analytics?.conversionRate || 10}%</div>
            <div className="metric-change">
              Applied to hired ratio
            </div>
          </div>
          <div className="badge badge-info">+2%</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon positions">👥</div>
          <div className="metric-info">
            <div className="metric-label">Active Open Positions</div>
            <div className="metric-value">{analytics?.openPositions || 0}</div>
            <div className="metric-change">
              Currently recruiting for
            </div>
          </div>
          <div className="badge badge-primary">+2</div>
        </div>

        <div className="metric-card">
          <div className="metric-icon cost">💰</div>
          <div className="metric-info">
            <div className="metric-label">Cost Per Hire</div>
            <div className="metric-value">${analytics?.costPerHire?.toLocaleString() || '3,500'}</div>
            <div className="metric-change">
              Average recruitment cost
            </div>
          </div>
          <div className="badge badge-success">Down</div>
        </div>
      </div>

      <div className="charts-row">
        {/* Time-to-Hire Trend */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-icon">⏱️</div>
              <h3>Time-to-Hire Trend</h3>
            </div>
          </div>
          <div className="chart-subtitle">
            Average days from application to offer (Last 6 months)
          </div>
          <div className="line-chart">
            <div className="chart-y-axis">
              <span>60</span>
              <span>45</span>
              <span>30</span>
              <span>15</span>
              <span>0</span>
            </div>
            <div className="chart-content">
              <svg viewBox="0 0 400 200" className="line-chart-svg">
                <polyline
                  points={timeToHireTrend.map((d, i) => 
                    `${(i * 80) + 40},${200 - (d.days * 3)}`
                  ).join(' ')}
                  fill="none"
                  stroke="#10b981"
                  strokeWidth="3"
                />
                {timeToHireTrend.map((d, i) => (
                  <circle
                    key={i}
                    cx={(i * 80) + 40}
                    cy={200 - (d.days * 3)}
                    r="5"
                    fill="#10b981"
                  />
                ))}
              </svg>
              <div className="chart-x-axis">
                {timeToHireTrend.map((d, i) => (
                  <span key={i}>{d.month}</span>
                ))}
              </div>
            </div>
          </div>
          <div className="chart-insight">
            ↓ 40% improvement · Time-to-hire reduced from 42 to 25 days
          </div>
        </div>

        {/* Candidate Source Effectiveness */}
        <div className="chart-card">
          <div className="chart-header">
            <div>
              <div className="chart-icon">📊</div>
              <h3>Candidate Source Effectiveness</h3>
            </div>
          </div>
          <div className="chart-subtitle">
            Distribution of hires by source channel
          </div>
          <div className="pie-chart">
            <svg viewBox="0 0 200 200">
              {(() => {
                let currentAngle = 0;
                return sourceEffectiveness.map((item, index) => {
                  const angle = (item.value / 100) * 360;
                  const startAngle = currentAngle;
                  const endAngle = currentAngle + angle;
                  currentAngle = endAngle;

                  const startRad = (startAngle - 90) * (Math.PI / 180);
                  const endRad = (endAngle - 90) * (Math.PI / 180);

                  const x1 = 100 + 80 * Math.cos(startRad);
                  const y1 = 100 + 80 * Math.sin(startRad);
                  const x2 = 100 + 80 * Math.cos(endRad);
                  const y2 = 100 + 80 * Math.sin(endRad);

                  const largeArc = angle > 180 ? 1 : 0;

                  return (
                    <path
                      key={index}
                      d={`M 100 100 L ${x1} ${y1} A 80 80 0 ${largeArc} 1 ${x2} ${y2} Z`}
                      fill={item.color}
                    />
                  );
                });
              })()}
            </svg>
          </div>
          <div className="pie-legend">
            {sourceEffectiveness.map((item, index) => (
              <div key={index} className="legend-item">
                <span className="legend-color" style={{ backgroundColor: item.color }}></span>
                <span className="legend-label">{item.source}</span>
                <span className="legend-value">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recruitment Funnel */}
      <div className="chart-card full-width">
        <div className="chart-header">
          <div>
            <div className="chart-icon">📉</div>
            <h3>Recruitment Funnel Conversion</h3>
          </div>
        </div>
        <div className="chart-subtitle">
          Candidate progression through hiring stages
        </div>
        <div className="funnel-chart">
          {funnelData.map((stage, index) => (
            <div key={index} className="funnel-stage">
              <div className="funnel-label">{stage.stage}</div>
              <div className="funnel-bar-container">
                <div 
                  className="funnel-bar"
                  style={{ width: `${(stage.count / maxFunnelCount) * 100}%` }}
                >
                  <span className="funnel-count">{stage.count}</span>
                </div>
              </div>
              <div className="funnel-percentage">{stage.count}</div>
            </div>
          ))}
        </div>
        <div className="chart-insight">
          10% conversion rate · 25 hires from 250 applications
        </div>
      </div>

      {/* Diversity Metrics */}
      <div className="chart-card full-width">
        <div className="chart-header">
          <div>
            <div className="chart-icon">👥</div>
            <h3>Diversity Metrics</h3>
          </div>
        </div>
        <div className="chart-subtitle">
          Representation in recent hires (mockup data)
        </div>
        <div className="diversity-section">
          <div className="diversity-group">
            <h4>Gender Distribution</h4>
            {diversityMetrics.gender.map((item, index) => (
              <div key={index} className="diversity-bar">
                <span className="diversity-label">{item.label}</span>
                <div className="diversity-bar-bg">
                  <div 
                    className="diversity-bar-fill"
                    style={{ width: `${item.value}%` }}
                  ></div>
                </div>
                <span className="diversity-value">{item.value}%</span>
              </div>
            ))}
          </div>

          <div className="diversity-group">
            <h4>Ethnicity Distribution</h4>
            {diversityMetrics.ethnicity.map((item, index) => (
              <div key={index} className="diversity-bar">
                <span className="diversity-label">{item.label}</span>
                <div className="diversity-bar-bg">
                  <div 
                    className="diversity-bar-fill ethnicity"
                    style={{ width: `${item.value}%` }}
                  ></div>
                </div>
                <span className="diversity-value">{item.value}%</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Executive Summary */}
      <div className="executive-summary">
        <div className="summary-header">
          <div className="summary-icon">📊</div>
          <h3>Executive Summary - Q4 2025</h3>
        </div>
        <div className="summary-content">
          <div className="summary-item">
            <div className="summary-badge success">✓ Process Efficiency</div>
            <p>Time-to-hire improved to 25 days, reducing from 42 to 25 days on average</p>
          </div>
          <div className="summary-item">
            <div className="summary-badge success">✓ Quality Hiring</div>
            <p>Accepted offer quality candidates by 35% when 82% average fit scores</p>
          </div>
          <div className="summary-item">
            <div className="summary-badge warning">⚠ Cost Savings</div>
            <p>Cost-per-hire reduced by $520, achieving 12% cost reduction this quarter</p>
          </div>
        </div>
        <div className="summary-insight">
          <strong>Key Insights:</strong> Referrals are our top-performing channels, accounting for 53% of successful hires. Consider increasing investment in these areas while maintaining diversity initiatives.
        </div>
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
