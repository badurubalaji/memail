import { trigger, transition, style, animate, query, group, state, stagger, keyframes } from '@angular/animations';

export const slideInOut = trigger('slideInOut', [
  transition('* <=> *', [
    group([
      query(':enter', [
        style({ transform: 'translateX(100%)', opacity: 0 }),
        animate('300ms ease-in-out', style({ transform: 'translateX(0%)', opacity: 1 }))
      ], { optional: true }),
      query(':leave', [
        style({ transform: 'translateX(0%)', opacity: 1 }),
        animate('300ms ease-in-out', style({ transform: 'translateX(-100%)', opacity: 0 }))
      ], { optional: true })
    ])
  ])
]);

export const fadeInOut = trigger('fadeInOut', [
  transition(':enter', [
    style({ opacity: 0, transform: 'translateY(10px)' }),
    animate('200ms ease-in', style({ opacity: 1, transform: 'translateY(0)' }))
  ]),
  transition(':leave', [
    animate('200ms ease-out', style({ opacity: 0, transform: 'translateY(10px)' }))
  ])
]);

export const expandCollapse = trigger('expandCollapse', [
  transition(':enter', [
    style({ height: 0, opacity: 0, overflow: 'hidden' }),
    animate('250ms ease-in-out', style({ height: '*', opacity: 1 }))
  ]),
  transition(':leave', [
    style({ height: '*', opacity: 1, overflow: 'hidden' }),
    animate('250ms ease-in-out', style({ height: 0, opacity: 0 }))
  ])
]);

/**
 * Message card animation for threaded view
 */
export const messageCard = trigger('messageCard', [
  state('collapsed', style({
    height: '60px',
    opacity: 0.8
  })),
  state('expanded', style({
    height: '*',
    opacity: 1
  })),
  transition('collapsed <=> expanded', [
    animate('250ms cubic-bezier(0.4, 0.0, 0.2, 1)')
  ])
]);

/**
 * Scale in animation for modals and dialogs
 */
export const scaleIn = trigger('scaleIn', [
  transition(':enter', [
    style({ transform: 'scale(0.8)', opacity: 0 }),
    animate('200ms cubic-bezier(0.34, 1.56, 0.64, 1)',
      style({ transform: 'scale(1)', opacity: 1 }))
  ]),
  transition(':leave', [
    animate('150ms ease-out',
      style({ transform: 'scale(0.8)', opacity: 0 }))
  ])
]);

/**
 * List item stagger animation
 */
export const staggerItems = trigger('staggerItems', [
  transition('* => *', [
    query(':enter', [
      style({ opacity: 0, transform: 'translateY(20px)' }),
      stagger(50, [
        animate('300ms ease-out',
          style({ opacity: 1, transform: 'translateY(0)' }))
      ])
    ], { optional: true })
  ])
]);