export function getAgentSharingPath(agentName: string) {
  return `/preview-agent?agent=${encodeURIComponent(agentName.trim())}`;
}

export function getPreselectedAgent(search: string, availableAgents: string[]) {
  const requested = new URLSearchParams(search).get('agent')?.trim() ?? '';
  return availableAgents.includes(requested) ? requested : '';
}
