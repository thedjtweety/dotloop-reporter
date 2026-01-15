/**
 * BenchmarkComparisonPage
 * Wrapper page that handles data loading and passes to BenchmarkComparison component
 */
import React, { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { getRecentFiles } from '@/lib/storage';
import { parseCSV, calculateAgentMetrics, DotloopRecord, AgentMetrics } from '@/lib/csvParser';
import { BenchmarkComparison } from '@/pages/BenchmarkComparison';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export const BenchmarkComparisonPage: React.FC = () => {
  const [, navigate] = useLocation();
  const [records, setRecords] = useState<DotloopRecord[]>([]);
  const [agentMetrics, setAgentMetrics] = useState<AgentMetrics[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const recentFiles = getRecentFiles();
        
        if (recentFiles.length === 0) {
          setError('No data available. Please upload a CSV file first.');
          setLoading(false);
          return;
        }

        // Load the most recent file
        const mostRecent = recentFiles[0];
        const fileContent = localStorage.getItem(`file_${mostRecent.id}`);
        
        if (!fileContent) {
          setError('Could not load file data. Please upload again.');
          setLoading(false);
          return;
        }

        const parsed = parseCSV(fileContent);
        const metrics = calculateAgentMetrics(parsed);

        setRecords(parsed);
        setAgentMetrics(metrics);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load data');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading benchmark data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <Button
          variant="ghost"
          onClick={() => navigate('/')}
          className="mb-6"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
          <p className="text-red-800 font-medium">{error}</p>
          <Button
            onClick={() => navigate('/')}
            className="mt-4"
          >
            Upload Data
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <Button
        variant="ghost"
        onClick={() => navigate('/')}
        className="mb-6"
      >
        <ArrowLeft className="w-4 h-4 mr-2" />
        Back to Dashboard
      </Button>
      <BenchmarkComparison records={records} agentMetrics={agentMetrics} />
    </div>
  );
};

export default BenchmarkComparisonPage;
