import type { CallContext } from '@/common/correlation/call-context';
import type { PortfolioResponse } from '@/modules/portfolio/application/dto/portfolio-response.types';

export function applyGetPortfolioSuccessCallContext(
  context: CallContext | undefined,
  portfolio: PortfolioResponse,
): void {
  if (context === undefined) {
    return;
  }
  context.title = 'GetPortfolio';
  context.attributes = {
    has_positions: portfolio.positions.length > 0,
    position_count: portfolio.positions.length,
  };
}
