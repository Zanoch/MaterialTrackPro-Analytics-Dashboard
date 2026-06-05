# MaterialTrackPro Analytics Dashboard

A read-only analytics and operations dashboard that surfaces live data from the Grandpass factory side of the MTP platform. Operators use it to monitor tea inventory, track blending and flavoring operations, follow active shipments, and review trader request history — all from a single browser interface without needing access to the transactional Admin Panel.

Built with React 19, TypeScript, and Vite. Data is fetched through TanStack Query against the `grandpass-handler` Lambda via AWS Amplify's managed API client, which attaches SigV4 signatures automatically. Authentication is handled by Cognito; the user's group membership is read from the ID token at login and stored in a Zustand store for the lifetime of the session.

## Usage

### Prerequisites

- Node.js 20 or later
- npm 10 or later
- `config.json` — Amplify configuration at the project root connecting the app to Cognito and API Gateway (not committed; see Environment Setup)

### Environment Setup

Amplify reads its configuration from `config.json` at the project root (imported in `src/main.tsx`). The file is not committed — the values can be sourced from the AWS-Manager stack outputs. Place it with the following structure:

```json
{
  "Auth": {
    "Cognito": {
      "userPoolId": "REGION_XXXXXXXXX",
      "userPoolClientId": "XXXXXXXXXXXXXXXXXXXXXXXXXX",
      "identityPoolId": "REGION:XXXXXXXX-XXXX-XXXX-XXXX-XXXXXXXXXXXX"
    }
  },
  "API": {
    "REST": {
      "MTP-API": {
        "endpoint": "https://XXXXXXXXXX.execute-api.REGION.amazonaws.com/prod"
      }
    }
  }
}
```

### Setup & Run

```bash
npm install
npm run dev
```

The development server starts at `http://localhost:5173`. A production build is produced with `npm run build`.

### Build & Deploy

```bash
npm run build
```

The `dist/` output is uploaded to the `/analytics-dashboard` prefix of the shared S3 bucket provisioned by AWS-Manager. See [Web Client Hosting](../MaterialTrackPro-AWS-Manager/docs/architecture.md#web-client-hosting) for the bucket name and distribution ID.

```bash
aws s3 sync dist/ s3://<BUCKET_NAME>/analytics-dashboard/ --delete
```

After uploading, invalidate the CloudFront distribution to ensure the updated files are served:

```bash
aws cloudfront create-invalidation --distribution-id <DISTRIBUTION_ID> --paths "/*"
```

## System Overview

### Architecture

The dashboard is a single-page application organized around nine data views, each backed by a dedicated React Query hook and API service. On load, Amplify resolves the user's Cognito session; the `Authenticator` component in `src/components/auth/index.tsx` extracts the first Cognito group from the ID token, stores it as the user's role, and renders the application shell. Unauthenticated requests redirect to the login screen.

Navigation is handled by React Router. The sidebar (`src/components/layout/Sidebar.tsx`) lists all nine pages directly — there is no role-based page hiding; access control is enforced at the API layer by the Lambda.

All API calls flow through `src/api/amplifyClient.ts`, which wraps Amplify's `get`/`post`/`put`/`del` primitives under a unified interface. Endpoints are defined in `src/api/endpoints.ts`; all are rooted under `/grandpass/`, served by the `grandpass-handler` Lambda.

The nine views and their primary API endpoints are:

| Page              | Route              | Endpoint                                                                 |
| ----------------- | ------------------ | ------------------------------------------------------------------------ |
| Tealine Inventory | `/inventory`       | `GET /grandpass/admin/tealine/inventory-complete`                        |
| Pending Tealines  | `/pending-tealine` | `GET /grandpass/tealine/pending-with-calculations`                       |
| Blend Operations  | `/blendsheet`      | `GET /grandpass/admin/blendsheet/operations-data`                        |
| Flavor Operations | `/flavorsheet`     | `GET /grandpass/admin/flavorsheet/operations-data`                       |
| Herbline          | `/herbline`        | `GET /grandpass/admin/herbline`                                          |
| Blendbalance      | `/blendbalance`    | `GET /grandpass/admin/blendbalance`                                      |
| Order Status      | `/order-status`    | `GET /grandpass/order/plan`, `GET /grandpass/order/schedule/analytics`   |
| Shipment Log      | `/shipment-log`    | `GET /grandpass/order/shipment/log`                                      |
| Trader Requests   | `/trader-requests` | `GET /grandpass/analytics/trader-requests/blendsheet`, `.../flavorsheet` |

**Tealine Inventory** is the default landing page (`/inventory`). It shows the full Seeduwa tea stock — total bags, weight, and remaining weight per item code — with server-side pagination and search. Clicking any row opens a detail sidebar showing individual bag IDs, locations, net weights, and a receiving-duration breakdown.

**Pending Tealines** surfaces item codes that have bags recorded but have not yet been processed into blendsheet batches.

**Blend Operations** and **Flavor Operations** follow the same layout: KPI summary cards (total planned, blend-in, blend-out weight) at the top, a server-paginated table of blendsheets or flavorsheets below. Rows with active batches are expandable; the expanded view shows per-batch item codes, blend-in/out weights, timestamps, and per-batch efficiency. Status is computed client-side from batch data: `NOT_STARTED` if no batches exist, `COMPLETED` if all batches carry the `COMPLETED` flag, otherwise `IN_PROGRESS`. Both pages export to CSV and PDF via jsPDF.

**Herbline** tracks herb ingredient inventory with client-side search filtering across item code and name.

**Blendbalance** shows tea balance records with table and transfer views, with search and filter capabilities.

**Order Status** presents the Grandpass ↔ Seeduwa order lifecycle in two tabs: Order Requests (material-level, with status cards showing pending/in-transit/received counts) and Order Schedules (plan-level). The status cards are driven by the `schedule/analytics` endpoint.

**Shipment Log** is an accordion table grouped by vehicle number and dispatch date. Expanding a vehicle row reveals the orders it carried; expanding an order row shows the individual bag barcodes and weights. Each vehicle row has a print button that generates a gatepass document via a hidden iframe.

**Trader Requests** shows the historical record of trader approval decisions for blendsheet and flavorsheet batches. A month picker controls the date window; rows with lab samples are expandable to show per-batch moisture content, bag ID, and storekeeper. Each row also has a print button for the trader request document.

### Core Technologies

| Technology              | Version | Role                                            |
| ----------------------- | ------- | ----------------------------------------------- |
| React                   | 19      | UI framework                                    |
| TypeScript              | 5.8     | Type safety                                     |
| Vite                    | 6       | Build tool and dev server                       |
| TanStack Query          | 5       | Server state, caching, background refetch       |
| AWS Amplify             | 6       | Cognito authentication + SigV4-signed API calls |
| React Router            | 7       | Client-side navigation                          |
| Zustand                 | 5       | Lightweight global state (user, sidebar)        |
| Tailwind CSS            | 3       | Utility-first styling                           |
| Recharts                | 3       | Chart components                                |
| jsPDF + jspdf-autotable | 3 / 5   | PDF export                                      |
| Lucide React            | 0.522   | Icon library                                    |

## Known Issues / Limitations

- **Location View and Analytics View** in Tealine Inventory are placeholder stubs that display a "coming soon" message. These views are toggled in the UI but contain no data.
- **Order Status filters** (date range, status, vehicle number) are present in the UI code but are temporarily disabled behind a `{false && ...}` guard and have no effect.
- **Order Status export** button is wired to the UI but calls only a `console.log` stub — no file is produced.
- **Herbline export** is similarly stubbed.
- Export in Blend Operations and Tealine Inventory operates on the current page only; there is no full-dataset export path.
