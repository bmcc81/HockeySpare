import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './home.html',
  styleUrl: './home.scss',
})
export class HomeComponent {
  readonly features = [
    {
      title: 'Post in seconds',
      text: 'Create a player offer or team request fast with simple forms built for hockey nights.',
      icon: '🏒',
    },
    {
      title: 'Find the right fit',
      text: 'Match by skill level, position, arena, pay, and availability.',
      icon: '🎯',
    },
    {
      title: 'Built for last-minute hockey',
      text: 'Whether your goalie cancels or you need a skate tonight, HockeySpare helps you fill the spot.',
      icon: '⚡',
    },
  ];

  readonly steps = [
    {
      step: '01',
      title: 'Post your need',
      text: 'Create a request for a skater or goalie, or post yourself as available.',
    },
    {
      step: '02',
      title: 'Browse and connect',
      text: 'View nearby opportunities and connect with the right team or player.',
    },
    {
      step: '03',
      title: 'Get on the ice',
      text: 'Show up, play, and keep your hockey night alive.',
    },
  ];

  readonly stats = [
    { value: 'Fast', label: 'last-minute posting' },
    { value: 'Local', label: 'arena-based discovery' },
    { value: 'Simple', label: 'clean booking flow' },
  ];
}