// Reading-window gates use viewport HEIGHT. IntersectionObserver percentages
// resolve against width, which makes them unsuitable for this art direction.
// Start after roughly 20–28% of a viewport-height composition has entered.
export const motionProfiles={visual:.80,scene:.75,detail:.72,card:.77};
export function motionRootMargin(height,profile){
 const fraction=motionProfiles[profile];
 if(!Number.isFinite(height)||height<=0||fraction===undefined)throw new TypeError('Invalid motion reading window');
 return `0px 0px -${Math.round(height*(1-fraction))}px 0px`;
}
export const motionScenes=[
 {selector:'.wedding-date-section',profile:'scene'},
 {selector:'.wedding-calendar',profile:'visual'},
 {selector:'.calendar-reminder',profile:'detail'},
 {selector:'.wedding-countdown',profile:'scene'},
 {selector:'.venue-chapter',profile:'visual'},
 {selector:'.venue-copy',profile:'scene'},
 {selector:'.dress-chapter>.chapter-heading',profile:'scene'},
 {selector:'.dress-notices',profile:'detail'},
 {selector:'.dress-original-tabs',profile:'scene'},
 {selector:'.dress-palette-heading',profile:'detail'},
 {selector:'.dress-palette-families',profile:'scene'},
 {selector:'.palette-family',profile:'card'},
 {selector:'.dress-palette-hint,.lookbook-guidance',profile:'detail'},
 {selector:'.dress-materials>h3',profile:'detail'},
 {selector:'.material-group',profile:'visual'},
 {selector:'.material-notes',profile:'detail'},
 {selector:'.lookbook',profile:'card'},
 {selector:'.lookbook-description',profile:'card'},
 {selector:'.guest-chapter>.chapter-heading',profile:'scene'},
 {selector:'.wishlist-teaser,.wishlist-intro',profile:'scene'},
 {selector:'.wishlist-filters,.gift-print',profile:'card'},
 {selector:'.guest-chapter>.page-switch,.family-switch,.family-side-title',profile:'detail'},
 {selector:'.family-anchor-card',profile:'card'},
 {selector:'.guest-album .guest-print',profile:'card'},
 {selector:'.schedule-chapter>.chapter-heading',profile:'detail'},
 {selector:'.schedule-spread li',profile:'scene'},
 {selector:'.schedule-note',profile:'detail'},
 {selector:'.questions-heading',profile:'detail'},
 {selector:'.questions-list',profile:'scene'},
 {selector:'.question-item',profile:'detail'},
 {selector:'#rsvp>.chapter-heading',profile:'detail'},
 {selector:'.rsvp-paper,.rsvp-paper form>.required-hint,.rsvp-paper form>.writing-field,.attendance-choice,.rsvp-details>.writing-field,.rsvp-details>.paper-options,.rsvp-details>.rsvp-food-block,.rsvp-details>.drink-choices,.rsvp-details>.paper-checkbox,.rsvp-paper form>button[type=submit],.rsvp-demo,.rsvp-no-note',profile:'detail',trigger:'#rsvp>.chapter-heading'},
 {selector:'.footer',profile:'scene'},
 {selector:'.chapter .watercolor:not(.calendar-leaves)',profile:'visual'},
];
