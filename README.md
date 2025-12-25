# ERP Backend System

This project implements a simplified ERP backend focused on **inventory-driven business logic**.
The system enforces strict data consistency by ensuring that all stock movements are validated,
transactional, and traceable.

## Core Concepts

### Inventory-First Architecture
All business operations (sales, receipts) are driven by inventory state.
Inventory is the single source of truth.

### Product Tracking Types
- **SIMPLE** – quantity-based products
- **EXPIRABLE** – products with expiration dates
- **SERIALIZED** – unique serial-numbered items
- **LOT_TRACKED** – batch-based stock tracking
- **VARIANT** – parent-child product structures

### Document-Based Workflow
All stock changes happen through documents:
- Purchase Receipts increase stock
- Sales decrease stock
- Cancelled documents revert stock

Direct stock mutation is never allowed.

---

## Transaction Safety

All inventory-affecting operations are executed inside database transactions to guarantee:

- Atomicity (all or nothing)
- Consistency of stock levels
- Protection against partial writes

This ensures that invalid states (negative stock, orphan records) never occur.

---

## Architecture Overview

- **Service Layer** – contains all business logic
- **Inventory Module** – central stock management
- **Document Modules** – receipts and sales
- **Dashboard** – read-only aggregated views
- **Tests** – validate critical business invariants

Controllers are intentionally thin; business rules live in services.

---

### **The following items were intentionally not implemented:**

- **Authentication and authorization**
- **API controllers/HTTP layer**
- **UI or frontend integration**
- **Advanced inventory features** (returns, reservations, FIFO costing)

**Reason:**
The focus of this project is to demonstrate correct domain modeling, inventory consistency, and transactional behavior.
All omitted parts can be added later without changing the core architecture.

## Running the Project

```bash
npm install
npm run dev
