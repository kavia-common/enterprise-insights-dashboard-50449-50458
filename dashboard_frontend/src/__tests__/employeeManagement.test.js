import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import App from '../App';

function authAs(role = 'manager') {
  localStorage.setItem('auth.session.v1', JSON.stringify({ user: { name: 'Test User', role }, token: 't' }));
}

afterEach(() => {
  localStorage.clear();
});

test('employees list renders for manager', async () => {
  authAs('manager');
  render(
    <MemoryRouter initialEntries={['/employees']}>
      <App />
    </MemoryRouter>
  );
  expect(await screen.findByText(/Employees/i)).toBeInTheDocument();
});

test('announcements renders for employee (view only)', async () => {
  authAs('employee');
  render(
    <MemoryRouter initialEntries={['/announcements']}>
      <App />
    </MemoryRouter>
  );
  expect(await screen.findByText(/Announcements/i)).toBeInTheDocument();
});

test('employee detail renders within shell', async () => {
  authAs('manager');
  render(
    <MemoryRouter initialEntries={['/employees/1']}>
      <App />
    </MemoryRouter>
  );
  expect(await screen.findByText(/Loading profile/i)).toBeInTheDocument();
});

test('attendance page renders', async () => {
  authAs('admin');
  render(
    <MemoryRouter initialEntries={['/attendance']}>
      <App />
    </MemoryRouter>
  );
  expect(await screen.findByText(/Attendance/i)).toBeInTheDocument();
});

test('leave page renders and shows submit button', async () => {
  authAs('employee');
  render(
    <MemoryRouter initialEntries={['/leaves']}>
      <App />
    </MemoryRouter>
  );
  expect(await screen.findByText(/Leave Management/i)).toBeInTheDocument();
  expect(screen.getByRole('button', { name: /Submit Leave/i })).toBeInTheDocument();
});
