// Sizzle & Serve — order board: tickets spawn, wait, and get served.
// One clear job: everything about customer orders and their patience.

import { RECIPES, orderPatience, spawnEvery, maxOrders } from './config.js';

let ticketCounter = 0;

export class OrderBoard {
  constructor(rng) {
    this.rng = rng;
    this.tickets = []; // { id, recipeId, patience, maxPatience, born }
    this.spawnTimer = 4; // first ticket arrives a few seconds in
    this.servedFlash = null; // ticket id that just got served (for the pop)
  }

  reset() {
    this.tickets = [];
    this.spawnTimer = 4;
    this.servedFlash = null;
  }

  // Advance timers; spawn new tickets; expire impatient ones.
  // Returns 'walkout' when a ticket left, else null.
  tick(dt, elapsed, onWalkout) {
    let event = null;
    for (const t of this.tickets) t.patience -= dt;
    const expired = this.tickets.filter((t) => t.patience <= 0);
    if (expired.length > 0) {
      this.tickets = this.tickets.filter((t) => t.patience > 0);
      this.lostIds = expired.map((t) => t.id);
      onWalkout(expired.length);
      event = 'walkout';
    }
    this.spawnTimer -= dt;
    if (this.spawnTimer <= 0 && this.tickets.length < maxOrders(elapsed)) {
      this.spawnTicket(elapsed);
      this.spawnTimer = spawnEvery(elapsed);
    }
    return event;
  }

  spawnTicket(elapsed) {
    const patience = orderPatience(elapsed);
    const ticket = {
      id: `T${++ticketCounter}`,
      recipeId: this.rng.pickRecipe(),
      patience,
      maxPatience: patience,
    };
    this.tickets.push(ticket);
    return ticket;
  }

  // Try to serve `dishId` (a plated dish in the player's hand) to the
  // matching ticket. Returns the ticket, or null when nothing matches.
  serve(dishId) {
    const idx = this.tickets.findIndex((t) => t.recipeId === dishId);
    if (idx === -1) return null;
    const [ticket] = this.tickets.splice(idx, 1);
    this.servedFlash = ticket.id;
    return ticket;
  }

  // Patience left as a 0..1 fraction, for tips and the ticket's bar colour.
  patienceFraction(ticket) {
    return Math.max(0, ticket.patience / ticket.maxPatience);
  }

  recipeOf(ticket) {
    return RECIPES[ticket.recipeId];
  }
}
