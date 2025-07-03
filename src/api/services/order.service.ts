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
  type ShipmentEventWithContext
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

  // Get order by ID
  getOrderById: async (orderId: string): Promise<Order | null> => {
    try {
      const response = await amplifyApiClient.get(`${API_ENDPOINTS.ORDER.LIST}/${orderId}`);
      const order = response?.data || response;
      
      if (!order) return null;
      
      return {
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
      };
    } catch (error) {
      console.error('Error fetching order:', error);
      return null;
    }
  },

  // Get order items
  getOrderItems: async (orderId: string): Promise<OrderItem[]> => {
    try {
      const response = await amplifyApiClient.get(`${API_ENDPOINTS.ORDER.LIST}/${orderId}/items`);
      const data = response?.data || response;
      const items = Array.isArray(data) ? data : data?.items || [];
      
      return items.map((item: any) => ({
        item_id: item.item_id || item.id,
        order_id: orderId,
        product_code: item.product_code || item.code,
        product_name: item.product_name || item.name,
        grade: item.grade,
        quantity: item.quantity || 0,
        unit_weight: item.unit_weight || 0,
        total_weight: item.total_weight || item.weight || 0,
        unit_price: item.unit_price || item.price || 0,
        total_price: item.total_price || item.total || 0,
      }));
    } catch (error) {
      console.error('Error fetching order items:', error);
      return [];
    }
  },

  // Get shipments for order
  getOrderShipments: async (orderId: string): Promise<Shipment[]> => {
    try {
      const response = await amplifyApiClient.get(API_ENDPOINTS.ORDER.SHIPMENT, { order_id: orderId });
      const data = response?.data || response;
      const shipments = Array.isArray(data) ? data : data?.shipments || [];
      
      return shipments.map((shipment: any) => ({
        shipment_id: shipment.shipment_id || shipment.id,
        order_id: orderId,
        shipment_number: shipment.shipment_number || shipment.number,
        carrier: shipment.carrier,
        tracking_number: shipment.tracking_number || shipment.tracking,
        ship_date: new Date(shipment.ship_date || shipment.shipped_at),
        estimated_delivery: new Date(shipment.estimated_delivery || shipment.expected_delivery),
        status: shipment.status,
        total_weight: shipment.total_weight || shipment.weight || 0,
        total_packages: shipment.total_packages || shipment.packages || 0,
      }));
    } catch (error) {
      console.error('Error fetching shipments:', error);
      return [];
    }
  },

  // Get order statistics
  getOrderStats: async (filters?: OrderFilters): Promise<OrderStats> => {
    try {
      // Try to get stats from dedicated endpoint first
      const response = await amplifyApiClient.get(`${API_ENDPOINTS.ORDER.LIST}/stats`, filters);
      
      const data = response?.data || response;
      if (data) {
        return {
          total_orders: data.total_orders || 0,
          pending_orders: data.pending_orders || 0,
          active_orders: data.active_orders || 0,
          completed_orders: data.completed_orders || 0,
          total_value: data.total_value || 0,
          average_order_value: data.average_order_value || 0,
        };
      }
    } catch (error) {
      console.warn('Stats endpoint not available, calculating from orders list');
    }
    
    // Fallback to calculating from orders list
    try {
      const orders = await orderService.getOrders(filters);
      
      return {
        total_orders: orders.length,
        pending_orders: orders.filter(o => o.status === 'PENDING').length,
        active_orders: orders.filter(o => o.status === 'ACCEPTED' || o.status === 'IN_TRANSIT').length,
        completed_orders: orders.filter(o => o.status === 'RECEIVED').length,
        total_value: orders.reduce((sum, o) => sum + o.total_value, 0),
        average_order_value: orders.length > 0 ? 
          orders.reduce((sum, o) => sum + o.total_value, 0) / orders.length : 0,
      };
    } catch (error) {
      console.error('Error calculating order stats:', error);
      return {
        total_orders: 0,
        pending_orders: 0,
        active_orders: 0,
        completed_orders: 0,
        total_value: 0,
        average_order_value: 0,
      };
    }
  },

  // Get filter options
  getFilterOptions: async () => {
    try {
      const response = await amplifyApiClient.get(`${API_ENDPOINTS.ORDER.LIST}/filters`);
      
      const data = response?.data || response;
      if (data) {
        return {
          statuses: data.statuses || [],
          priorities: data.priorities || [],
          customers: data.customers || [],
        };
      }
    } catch (error) {
      console.warn('Filter options endpoint not available, using defaults');
    }
    
    // Fallback to internal facility transfer statuses
    return {
      statuses: ['PENDING', 'ACCEPTED', 'IN_TRANSIT', 'RECEIVED', 'CANCELLED'],
      priorities: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'],
      customers: ['Grandpass Packaging Facility', 'Seeduwa Blending Factory'],
    };
  },

  // Create new order
  createOrder: async (orderData: Partial<Order>): Promise<Order> => {
    const response = await amplifyApiClient.post(API_ENDPOINTS.ORDER.LIST, orderData);
    return response?.data || response;
  },

  // Update existing order
  updateOrder: async (orderId: string, orderData: Partial<Order>): Promise<Order> => {
    const response = await amplifyApiClient.put(`${API_ENDPOINTS.ORDER.LIST}/${orderId}`, orderData);
    return response?.data || response;
  },

  // Delete order
  deleteOrder: async (orderId: string): Promise<void> => {
    await amplifyApiClient.delete(`${API_ENDPOINTS.ORDER.LIST}/${orderId}`);
  },

  // Create order plan
  createOrderPlan: async (planData: any): Promise<any> => {
    const response = await amplifyApiClient.post(API_ENDPOINTS.ORDER.PLAN, planData);
    return response?.data || response;
  },

  // Get order schedule
  getOrderSchedule: async (filters?: any): Promise<any[]> => {
    const response = await amplifyApiClient.get(API_ENDPOINTS.ORDER.SCHEDULE, filters);
    const data = response?.data || response;
    return Array.isArray(data) ? data : data?.schedule || [];
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