📘 Kafka Data Flow README (Drop-In)
Overview

Kafka is used as the central event pipeline for all telemetry data.
Instead of writing directly to the database, incoming device events are first published to Kafka, validated, normalized, and then persisted by a dedicated audit service.

This creates a single source of truth, improves reliability, and allows the system to scale cleanly as more consumers are added.

Architecture Diagram (Conceptual)
Device (Pico / MQTT Publisher)
        ↓
      MQTT
        ↓
WebSocket Bridge
  - broadcasts to frontend
  - publishes raw telemetry events
        ↓
Kafka Topic: telemetry.raw
        ↓
Audit Service (Kafka Consumer)
  - validates schema
  - normalizes data
  - routes bad events to DLQ
  - inserts clean events into DB
        ↓
MySQL (telemetry table)
        ↓
Dashboard / Analytics

Kafka Topics
telemetry.raw

Raw telemetry events from devices

Produced by ws-bridge

Consumed by audit-service

May contain malformed or partial data

telemetry.cleaned

Validated and normalized telemetry

Produced by audit-service

Available for future consumers (analytics, alerts)

telemetry.dlq (Dead Letter Queue)

Events that fail parsing or validation

Used for debugging, device health checks, and replay

Why Kafka Is Used
1. Single Writer Model

Only one service (audit-service) writes to the database.
This avoids duplicate inserts, race conditions, and schema drift.

2. Validation Layer

All telemetry passes through a validation step before persistence.
Bad data is isolated instead of breaking the system.

3. Replayability

Because events live in Kafka, we can:

reprocess historical data

change schemas safely

rebuild derived tables

4. Future Scalability

New consumers can be added without touching existing code, such as:

alerting services

session analytics

anomaly detection

real-time aggregates at different rates

Service Responsibilities
WebSocket Bridge

Subscribes to MQTT

Broadcasts telemetry to frontend

Publishes raw events to Kafka

❌ Does NOT write to the database

Audit Service

Consumes telemetry.raw

Validates required fields (device_id, device_ts, etc.)

Normalizes schema

Writes clean data to MySQL

Sends invalid events to telemetry.dlq

Operational Scripts

start-services.sh
Starts API, WebSocket bridge, and audit service via PM2

stop-services.sh
Stops all backend services cleanly

Summary

Kafka decouples data ingestion from data persistence.
This makes the system more reliable, observable, and extensible without increasing complexity in the core services.
