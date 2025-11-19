import {
  type Order,
  type OrderItem,
  type Shipment,
  type OrderFilters,
  type OrderStats,
  type OrderPlanDetails,
  type OrderRequest,
  type OrderDashboardData,
  type OrderDashboardSummary,
  type OrderDashboardFilters,
  type ShipmentEventWithContext,
  type OrderSchedule
} from '../../types/order';
import { amplifyApiClient } from '../amplifyClient';
import { API_ENDPOINTS } from '../endpoints';

export const orderService = {
  // Get all orders
  getOrders: async (filters?: OrderFilters): Promise<Order[]> => {
    try {
      const response = await amplifyApiClient.get(API_ENDPOINTS.ORDER.LIST, filters);

      // Handle different response formats
      const data = response?.data || response;
      const orders = Array.isArray(data) ? data : data?.orders || [];

      // Transform API response to match our Order interface
      return orders.map((order: any) => ({
        order_id: order.order_id || order.id,
        order_number: order.order_number || order.number,
        customer_name: order.customer_name || order.customer,
        customer_email: order.customer_email || order.email,
        order_date: new Date(order.order_date || order.created_at),
        delivery_date: new Date(order.delivery_date || order.expected_delivery),
        status: order.status,
        priority: order.priority || 'MEDIUM',
        total_weight: order.total_weight || 0,
        total_value: order.total_value || order.value || 0,
        currency: order.currency || 'USD',
        created_by: order.created_by || order.user,
        updated_at: new Date(order.updated_at || order.modified_at),
      }));
    } catch (error) {
      console.error('Error fetching orders:', error);
      return [];
    }
  },

  // Get order schedule with real-time analytics (paginated)
  getOrderScheduleAnalytics: async (filters?: {
    schedule_date?: string;
    limit?: number;
    offset?: number;
  }): Promise<{
    data: OrderSchedule[];
    pagination: {
      total: number;
      limit: number;
      offset: number;
      page: number;
      totalPages: number;
      hasNext: boolean;
      hasPrev: boolean;
    };
  }> => {
    try {
      const response = await amplifyApiClient.get(API_ENDPOINTS.ORDER.SCHEDULE_ANALYTICS, filters);

      // Backend consistently returns: { data: [...], pagination: {...} }
      return {
        data: response.data.map((schedule: any) => ({
          schedule_code: String(schedule.schedule_code),
          schedule_date: schedule.schedule_date,
          order_code: schedule.order_code,
          shift: schedule.shift,
          section: schedule.section,
          quantity: schedule.quantity || 0,
          filled_quantity: schedule.filled_quantity || 0,
        })),
        pagination: response.pagination,
      };
    } catch (error) {
      console.error('Error fetching order schedule analytics:', error);
      return {
        data: [],
        pagination: {
          total: 0,
          limit: 25,
          offset: 0,
          page: 1,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }
  },

  // Dashboard-specific methods

  // Get order plans with allocation details
  getOrderPlans: async (currentDate?: string): Promise<OrderPlanDetails[]> => {
    try {
      const response = await amplifyApiClient.get(API_ENDPOINTS.ORDER.PLAN, currentDate ? { current_date: currentDate } : undefined);

      const data = response?.data || response;
      const plans = Array.isArray(data) ? data : [];

      return plans.map((plan: any) => ({
        order_code: plan.order_code,
        product_name: plan.product_name,
        requirement: plan.requirement || 0,
        plan_start: new Date(plan.plan_start),
        plan_end: new Date(plan.plan_end),
        allowed: plan.allowed || 0,
        requests: plan.requests || []
      }));
    } catch (error) {
      console.error('Error fetching order plans:', error);
      return [];
    }
  },

  // Get order requests with shipment events
  getOrderRequests: async (filters?: OrderDashboardFilters): Promise<OrderRequest[]> => {
    try {
      const response = await amplifyApiClient.get(API_ENDPOINTS.ORDER.LIST, filters);

      const data = response?.data || response;
      const requests = Array.isArray(data) ? data : [];

      return requests.map((request: any) => ({
        request_code: request.request_code,
        order_code: request.order_code,
        product_name: request.product_name,
        requirement: request.requirement || 0,
        comments: request.comments,
        shipments: (request.shipments || []).map((shipment: any) => {
          const events = shipment.events || [];
          const latestEvent = events.length > 0 ? events[events.length - 1] : null;

          return {
            shipment_code: shipment.shipment_code,
            quantity: shipment.quantity || 0,
            events: events,
            current_status: latestEvent?.status,
            latest_event: latestEvent
          };
        })
      }));
    } catch (error) {
      console.error('Error fetching order requests:', error);
      return [];
    }
  },

  // Create shipment event
  createShipmentEvent: async (events: Array<{
    request_code: string;
    shipment_code: number;
    status: string;
    shipment_vehicle?: string;
    shipment_remarks?: string;
    order_remarks?: string;
  }>): Promise<any> => {
    const response = await amplifyApiClient.post(`${API_ENDPOINTS.ORDER.SHIPMENT}/event`, events);
    return response?.data || response;
  },

  // Get dashboard data
  getOrderDashboardData: async (filters?: OrderDashboardFilters): Promise<OrderDashboardData> => {
    try {
      // Fetch data in parallel
      const [orderPlans, orderRequests] = await Promise.all([
        orderService.getOrderPlans(filters?.date_from),
        orderService.getOrderRequests(filters)
      ]);

      // Calculate summary metrics
      const summary = orderService.calculateDashboardSummary(orderPlans, orderRequests);

      // Extract recent events
      const recentEvents = orderService.extractRecentEvents(orderRequests);

      return {
        summary,
        orderPlans,
        activeOrders: orderRequests,
        recentEvents
      };
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      return {
        summary: {
          total_plans: 0,
          pending_requests: 0,
          accepted_orders: 0,
          in_transit: 0,
          received_today: 0,
          total_requirement_kg: 0,
          total_shipped_kg: 0,
          fulfillment_rate: 0
        },
        orderPlans: [],
        activeOrders: [],
        recentEvents: []
      };
    }
  },

  // Helper: Calculate dashboard summary
  calculateDashboardSummary: (plans: OrderPlanDetails[], requests: OrderRequest[]): OrderDashboardSummary => {
    const summary: OrderDashboardSummary = {
      total_plans: plans.length,
      pending_requests: 0,
      accepted_orders: 0,
      in_transit: 0,
      received_today: 0,
      total_requirement_kg: 0,
      total_shipped_kg: 0,
      fulfillment_rate: 0
    };

    // Calculate totals from plans
    summary.total_requirement_kg = plans.reduce((sum, plan) => sum + plan.requirement, 0);

    // Calculate from requests
    const today = new Date().toDateString();

    requests.forEach(request => {
      request.shipments.forEach(shipment => {
        const latestStatus = shipment.latest_event?.status;

        if (latestStatus === 'APPROVAL_REQUESTED' || latestStatus === 'ORDER_REQUESTED') {
          summary.pending_requests++;
        } else if (latestStatus === 'SHIPMENT_ACCEPTED') {
          summary.accepted_orders++;
        } else if (latestStatus === 'SHIPMENT_DISPATCHED') {
          summary.in_transit++;
          summary.total_shipped_kg += shipment.quantity;
        } else if (latestStatus === 'RECEIVED') {
          const eventDate = new Date(shipment.latest_event?.timestamp || Date.now());
          if (eventDate.toDateString() === today) {
            summary.received_today++;
          }
          summary.total_shipped_kg += shipment.quantity;
        }
      });
    });

    // Calculate fulfillment rate
    if (summary.total_requirement_kg > 0) {
      summary.fulfillment_rate = (summary.total_shipped_kg / summary.total_requirement_kg) * 100;
    }

    return summary;
  },

  // Helper: Extract recent events
  extractRecentEvents: (requests: OrderRequest[]): ShipmentEventWithContext[] => {
    const events: ShipmentEventWithContext[] = [];

    requests.forEach(request => {
      request.shipments.forEach(shipment => {
        shipment.events.forEach(event => {
          events.push({
            ...event,
            request_code: request.request_code,
            shipment_code: shipment.shipment_code,
            order_code: request.order_code,
            product_name: request.product_name,
            quantity: shipment.quantity
          });
        });
      });
    });

    // Sort by timestamp descending and return top 20
    return events
      .sort((a, b) => b.timestamp - a.timestamp)
      .slice(0, 20);
  },
};
