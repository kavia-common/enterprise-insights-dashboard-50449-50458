import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

// Basic tests to ensure login renders and protected routes redirect when not authenticated

test('renders login screen at /login', () => {
  render(
    <MemoryRouter initialEntries={['/login']}>
      <App />
    </MemoryRouter>
  );
  expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
});

test('redirects to /login when visiting protected route while logged out', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );
  // Since not authenticated, should show login page
  expect(screen.getByText(/Sign in/i)).toBeInTheDocument();
});
