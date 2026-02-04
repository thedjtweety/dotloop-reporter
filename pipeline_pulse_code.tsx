{/* Pipeline Pulse Dashboard */}
{metrics && filteredRecords.length > 0 && (
  <div className="mb-12 space-y-6" data-tour="pipeline-pulse">
    {/* KPI Cards Row */}
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <KPICard
        title="Total Transactions"
        value={metrics.totalTransactions}
        subtitle={`Avg: ${formatCurrency(metrics.averagePrice)}`}
        icon="📊"
        trend={metrics.trends?.totalTransactions}
        trendLabel="vs previous period"
        color="primary"
        onClick={() => handleMetricClick('total')}
      />
      <KPICard
        title="Total Sales Volume"
        value={formatCurrency(metrics.totalSalesVolume)}
        subtitle={`${metrics.closed} closed deals`}
        icon="💰"
        trend={metrics.trends?.totalVolume}
        trendLabel="vs previous period"
        color="success"
        onClick={() => handleMetricClick('volume')}
      />
      <KPICard
        title="Closing Rate"
        value={formatPercentage(metrics.closingRate)}
        subtitle={`${metrics.averageDaysToClose} days avg`}
        icon="🎯"
        trend={metrics.trends?.closingRate}
        trendLabel="vs previous period"
        color="accent"
        onClick={() => handleMetricClick('closing')}
      />
    </div>

    {/* Pipeline Funnel Chart */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <PipelineFunnelChart
        records={filteredRecords}
        onStageClick={handlePipelineStageClick}
      />
      <ProjectedToCloseCard records={filteredRecords} />
    </div>
  </div>
)}

{/* Pipeline Drill-Down Modal */}
<PipelineDrillDownModal
  isOpen={pipelinePulseModalOpen}
  onClose={() => setPipelinePulseModalOpen(false)}
  title={pipelinePulseModalTitle}
  records={pipelinePulseModalRecords}
  stageColor={pipelinePulseStageColor}
/>
