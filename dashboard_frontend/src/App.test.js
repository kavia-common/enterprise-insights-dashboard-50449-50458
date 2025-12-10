import { render, screen } from '@testing-library/react';
import App from './App';
import { MemoryRouter } from 'react-router-dom';

test('unauthenticated user sees login page', () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <App />
    </MemoryRouter>
  );
  const loginTitle = screen.getByText(/Sign in/i);
  expect(loginTitle).toBeInTheDocument();
});
