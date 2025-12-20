import React from 'react';
import { Briefcase, Users, Calendar, ArrowUpRight } from 'lucide-react';
import './StatsCards.css';

const StatsCards = ({ stats, onNavigate }) => {
  const cards = [
    {
      icon: <Briefcase size={24} />,
      title: 'Open Jobs',
      value: stats?.openJobs || 0,
      change: stats?.openJobsChange || '',
      color: '#3b82f6',
      page: 'jobs'
    },
    {
      icon: <Users size={24} />,
      title: 'Active Candidates',
      value: stats?.activeCandidates || 0,
      change: stats?.activeCandidatesChange || '',
      color: '#f97316',
      page: 'pipeline'
    },
    {
      icon: <Calendar size={24} />,
      title: 'Interviews Today',
      value: stats?.interviewsToday || 0,
      change: stats?.interviewsTodayChange || '',
      color: '#06b6d4',
      page: 'interviews'
    }
  ];

  return (
    <div className="stats-cards">
      {cards.map((card, index) => (
        <div key={index} className="stat-card" onClick={() => onNavigate && onNavigate(card.page)}>
          <div className="stat-card-header">
            <div className="stat-icon" style={{ color: card.color }}>
              {card.icon}
            </div>
            <button className="stat-expand">
              <ArrowUpRight size={16} />
            </button>
          </div>
          
          <div className="stat-content">
            <div className="stat-title">{card.title}</div>
            <div className="stat-value">{card.value}</div>
            <div className="stat-change">{card.change}</div>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StatsCards;
