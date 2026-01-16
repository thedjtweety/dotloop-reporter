import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SeedDataButton from '../SeedDataButton';
import { trpc } from '@/lib/trpc';

// Mock trpc
vi.mock('@/lib/trpc', () => ({
  trpc: {
    seed: {
      seedSampleData: {
        useMutation: vi.fn(),
      },
      clearSampleData: {
        useMutation: vi.fn(),
      },
    },
  },
}));

// Mock react-hot-toast
vi.mock('react-hot-toast', () => ({
  default: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('SeedDataButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders seed and clear buttons', () => {
    const mockSeedMutation = {
      mutateAsync: vi.fn(),
    };
    const mockClearMutation = {
      mutateAsync: vi.fn(),
    };

    vi.mocked(trpc.seed.seedSampleData.useMutation).mockReturnValue(mockSeedMutation as any);
    vi.mocked(trpc.seed.clearSampleData.useMutation).mockReturnValue(mockClearMutation as any);

    render(<SeedDataButton />);

    expect(screen.getByText('Seed Sample Data')).toBeInTheDocument();
    expect(screen.getByText('Clear')).toBeInTheDocument();
  });

  it('opens seed confirmation dialog when seed button is clicked', async () => {
    const mockSeedMutation = {
      mutateAsync: vi.fn(),
    };
    const mockClearMutation = {
      mutateAsync: vi.fn(),
    };

    vi.mocked(trpc.seed.seedSampleData.useMutation).mockReturnValue(mockSeedMutation as any);
    vi.mocked(trpc.seed.clearSampleData.useMutation).mockReturnValue(mockClearMutation as any);

    render(<SeedDataButton />);

    const seedButton = screen.getByText('Seed Sample Data');
    await userEvent.click(seedButton);

    await waitFor(() => {
      expect(screen.getByText('Seed Sample Data?')).toBeInTheDocument();
    });
  });

  it('calls seedSampleData mutation when confirmed', async () => {
    const mockMutateAsync = vi.fn().mockResolvedValue({ success: true });
    const mockSeedMutation = {
      mutateAsync: mockMutateAsync,
    };
    const mockClearMutation = {
      mutateAsync: vi.fn(),
    };

    vi.mocked(trpc.seed.seedSampleData.useMutation).mockReturnValue(mockSeedMutation as any);
    vi.mocked(trpc.seed.clearSampleData.useMutation).mockReturnValue(mockClearMutation as any);

    render(<SeedDataButton />);

    const seedButton = screen.getByText('Seed Sample Data');
    await userEvent.click(seedButton);

    await waitFor(() => {
      expect(screen.getByText('Seed Sample Data?')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /Seed Data/i });
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });
  });

  it('calls onSuccess callback after seeding', async () => {
    const mockOnSuccess = vi.fn();
    const mockMutateAsync = vi.fn().mockResolvedValue({ success: true });
    const mockSeedMutation = {
      mutateAsync: mockMutateAsync,
    };
    const mockClearMutation = {
      mutateAsync: vi.fn(),
    };

    vi.mocked(trpc.seed.seedSampleData.useMutation).mockReturnValue(mockSeedMutation as any);
    vi.mocked(trpc.seed.clearSampleData.useMutation).mockReturnValue(mockClearMutation as any);

    render(<SeedDataButton onSuccess={mockOnSuccess} />);

    const seedButton = screen.getByText('Seed Sample Data');
    await userEvent.click(seedButton);

    const confirmButton = screen.getByRole('button', { name: /Seed Data/i });
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('opens clear confirmation dialog when clear button is clicked', async () => {
    const mockSeedMutation = {
      mutateAsync: vi.fn(),
    };
    const mockClearMutation = {
      mutateAsync: vi.fn(),
    };

    vi.mocked(trpc.seed.seedSampleData.useMutation).mockReturnValue(mockSeedMutation as any);
    vi.mocked(trpc.seed.clearSampleData.useMutation).mockReturnValue(mockClearMutation as any);

    render(<SeedDataButton />);

    const clearButton = screen.getByText('Clear');
    await userEvent.click(clearButton);

    await waitFor(() => {
      expect(screen.getByText('Clear Sample Data?')).toBeInTheDocument();
    });
  });

  it('calls clearSampleData mutation when confirmed', async () => {
    const mockMutateAsync = vi.fn().mockResolvedValue({ success: true });
    const mockSeedMutation = {
      mutateAsync: vi.fn(),
    };
    const mockClearMutation = {
      mutateAsync: mockMutateAsync,
    };

    vi.mocked(trpc.seed.seedSampleData.useMutation).mockReturnValue(mockSeedMutation as any);
    vi.mocked(trpc.seed.clearSampleData.useMutation).mockReturnValue(mockClearMutation as any);

    render(<SeedDataButton />);

    const clearButton = screen.getByText('Clear');
    await userEvent.click(clearButton);

    await waitFor(() => {
      expect(screen.getByText('Clear Sample Data?')).toBeInTheDocument();
    });

    const confirmButton = screen.getByRole('button', { name: /Clear Data/i });
    await userEvent.click(confirmButton);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });
  });
});
