import { PlayerHighlightsComponent } from '../../shared/player-highlights/player-highlights';
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { InViewDirective } from '../../shared/directives/in-view.directive';

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

type ManagementFeature = {
  title: string;
  text: string;
};

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [PlayerHighlightsComponent, CommonModule, RouterLink, InViewDirective],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent {
  managementFeatures: ManagementFeature[] = [
    {
      title: 'Standings & schedules',
      text: 'Run a full season with automatic standings, game schedules, and division tracking.',
    },
    {
      title: 'Brackets & live scoreboard',
      text: 'Build tournament brackets and put live scores up on an arena TV or projector.',
    },
    {
      title: 'Rosters & registration',
      text: 'Collect team registrations, manage rosters, and keep everyone on the same schedule.',
    },
    {
      title: 'Silent auctions & fundraising',
      text: 'Run a tournament silent auction with public bidding, right alongside the schedule.',
    },
    {
      title: 'Printable programs',
      text: 'Generate a print-ready schedule, team list, and sponsor page for game day.',
    },
    {
      title: 'Spare coverage built in',
      text: 'When a team is short players, post a request without leaving your league or tournament.',
    },
  ];

  audienceCards: AudienceCard[] = [
    {
      title: 'For League & Tournament Organizers',
      text: 'Run the whole event from one place — schedules, standings, brackets, and the scoreboard.',
      points: [
        'Set up a league or tournament in minutes',
        'Manage divisions, schedules, and standings',
        'Share a public scoreboard and program',
      ],
      cta: 'Create a League or Tournament',
      link: '/leagues/new',
    },
    {
      title: 'For Teams',
      text: 'Manage your team and post a request fast when you need to fill your lineup.',
      points: [
        'Track your schedule and standings',
        'Post your game in minutes when short a player',
        'Choose position, level, date, and arena',
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

  organizerSteps: Step[] = [
    {
      title: 'Set up your league or tournament',
      text: 'Add divisions, teams, dates, and arenas to get your event structured.',
    },
    {
      title: 'Build the schedule',
      text: 'Generate the schedule or bracket and keep standings updating automatically.',
    },
    {
      title: 'Go live on game day',
      text: 'Share the public scoreboard, program, and schedule with everyone involved.',
    },
    {
      title: 'Cover last-minute gaps',
      text: 'If a team is short, post a spare request straight from the same platform.',
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
    { value: 'End to end', label: 'Leagues, tournaments, and spares in one place' },
    { value: 'Live', label: 'Standings, brackets, and scoreboards' },
    { value: 'Local', label: 'Built for hockey communities' },
  ];
}
