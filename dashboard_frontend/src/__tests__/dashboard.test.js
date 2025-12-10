import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

// Helper to pre-authenticate as a given role
function withAuthenticatedStorage(role = 'manager') {
  const session = {
    user: { name: 'Test User', role },
    token: 'mock-token',
  };
  localStorage.setItem('auth.session.v1', JSON.stringify(session));
}

afterEach(() => {
  localStorage.clear();
});

test('dashboard overview renders for manager role with sales period controls', async () => {
  withAuthenticatedStorage('manager');
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  // Expect KPI grid and Sales Overview title
  expect(await screen.findByText(/Enterprise Dashboard/i)).toBeInTheDocument();
  expect(await screen.findByText(/Sales Overview/i)).toBeInTheDocument();

  // Period buttons
  const dailyBtn = screen.getByRole('button', { name: /Daily/i });
  const weeklyBtn = screen.getByRole('button', { name: /Weekly/i });
  const monthlyBtn = screen.getByRole('button', { name: /Monthly/i });

  expect(dailyBtn).toBeInTheDocument();
  expect(weeklyBtn).toBeInTheDocument();
  expect(monthlyBtn).toBeInTheDocument();

  // Switch period and ensure loading text appears momentarily (mocked)
  fireEvent.click(weeklyBtn);
  await waitFor(() => {
    // The component shows Loading weekly metrics… text
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });

  // Switch to monthly
  fireEvent.click(monthlyBtn);
  await waitFor(() => {
    expect(screen.getByText(/Loading/i)).toBeInTheDocument();
  });
});

test('dashboard overview renders for admin role', async () => {
  withAuthenticatedStorage('admin');
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );

  expect(await screen.findByText(/Sales Overview/i)).toBeInTheDocument();
});
