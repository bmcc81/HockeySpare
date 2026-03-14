import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

type AudienceCard = {
  title: string;
  text: string;
  points: string[];
  cta: string;
  link: string;
};

type Step = {
  title: string;
  text: string;
};

type FeaturedRequest = {
  type: string;
  date: string;
  arena: string;
  level: string;
  pay: string;
  note: string;
  link: string;
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent {
  audienceCards: AudienceCard[] = [
    {
      title: 'For Teams',
      text: 'Post a request fast and fill your lineup without the last-minute scramble.',
      points: [
        'Post your game in minutes',
        'Choose position, level, date, and arena',
        'Review available players and goalies',
      ],
      cta: 'Post a Request',
      link: '/requests/team/new',
    },
    {
      title: 'For Players & Goalies',
      text: 'Browse open games, offer to spare, and get booked for the right fit.',
      points: [
        'Create your player profile',
        'Filter by position, level, and distance',
        'Apply to games that match your availability',
      ],
      cta: 'Offer to Play',
      link: '/requests/player/new',
    },
  ];

  teamSteps: Step[] = [
    {
      title: 'Post your game',
      text: 'Add the date, time, arena, and the kind of spare you need.',
    },
    {
      title: 'Set your preferences',
      text: 'Choose position, skill level, pay, and any extra notes.',
    },
    {
      title: 'Review matches',
      text: 'See available players or goalies that fit your request.',
    },
    {
      title: 'Confirm and play',
      text: 'Book your spare and get your team back on track.',
    },
  ];

  playerSteps: Step[] = [
    {
      title: 'Create your profile',
      text: 'Set your position, level, and preferred playing areas.',
    },
    {
      title: 'Browse open games',
      text: 'Search for requests that fit your schedule and skill level.',
    },
    {
      title: 'Apply quickly',
      text: 'Offer to join and show teams you are available.',
    },
    {
      title: 'Get booked',
      text: 'Connect, confirm, and hit the ice.',
    },
  ];

  featuredRequests: FeaturedRequest[] = [
    {
      type: 'Goalie Needed',
      date: 'Fri · 9:30 PM',
      arena: 'Pierrefonds Arena',
      level: 'Intermediate',
      pay: '$45',
      note: 'Need confirmed ASAP for league game.',
      link: '/requests',
    },
    {
      type: 'Defense Needed',
      date: 'Sun · 7:00 PM',
      arena: 'Forum de Montréal',
      level: 'Beginner / Intermediate',
      pay: '$20',
      note: 'Friendly pickup game. Good pace, good group.',
      link: '/requests',
    },
    {
      type: 'Player Needed',
      date: 'Tue · 10:15 PM',
      arena: 'Complexe Sportif CN',
      level: 'Competitive',
      pay: '$30',
      note: 'Looking for a reliable winger.',
      link: '/requests',
    },
  ];

  stats = [
    { value: 'Fast', label: 'Last-minute booking flow' },
    { value: 'Clear', label: 'Simple post and browse experience' },
    { value: 'Local', label: 'Built for hockey communities' },
  ];
}