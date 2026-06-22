/**
 * Tiny in-memory data source for the routing example.
 */
export const users = [
  { id: 1, name: 'Ada Lovelace', role: 'Mathematician', bio: 'Wrote the first algorithm intended for a machine.' },
  { id: 2, name: 'Alan Turing', role: 'Computer Scientist', bio: 'Formalised computation and the Turing machine.' },
  { id: 3, name: 'Grace Hopper', role: 'Engineer', bio: 'Pioneered machine-independent programming languages.' },
  { id: 4, name: 'Dennis Ritchie', role: 'Programmer', bio: 'Created the C language and co-created Unix.' },
];

export function getUser(id) {
  return users.find((u) => u.id === Number(id)) || null;
}
