import { createBrowserRouter, Outlet, RouterProvider } from 'react-router';
import AppLayout from './components/AppLayout';
import HomePage from './pages/HomePage';

const router = createBrowserRouter(
  [
    {
      path: '/',
      element: (
        <AppLayout>
          <Outlet />
        </AppLayout>
      ),
      children: [
        {
          path: '/',
          element: <HomePage />,
        },
      ],
    },
  ],
  {
    basename: '/vite-base-path',
  },
);

const AppRouter = () => <RouterProvider router={router} />;

export default AppRouter;
