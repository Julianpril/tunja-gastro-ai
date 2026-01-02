# Architecture

```mermaid
graph TD
    Client[React Native App] -->|API Calls| API[FastAPI Backend]
    API -->|Process Data| DB[(PostgreSQL)]
    API -->|Request Prediction| ML[ML Service]
    ML -->|Load Models| Models[Trained Models]
    ML -->|Train| Data[CSVs/DB]
```
