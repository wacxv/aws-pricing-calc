# AwsPricingCalcu

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 19.1.6.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Karma](https://karma-runner.github.io) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.


---

## 📦 Patch Notes – v1.8: Amazon Connect Pricing Tool

### 🐞 Bugs Found:
- 📉 **Voice and Video (Outbound)**: Showing 0 cost rows, but only total costs displayed. Needs accurate cost breakdown.
- 📬 **Guides Section**:
  - Message cost not appearing.
  - Message usage amount not showing either.
- 📊 **Analytics**: Nothing calculating or showing in the table across all sections.
- ⚠️ **Duplicate Calculation IDs**: No error shown when same calculation IDs are in a collection. Add fallback error message.
- ❓ **UNKNOWN SERVICE**: Collections display "UNKNOWN SERVICE" due to service mapping issue.
- 📋 **Copy to Another Calculation**: Displays error message even when it works. Suggested to remove feature entirely if not stable.

---

### 🔧 Updates & Features:
- 📁 **Collection Feature**: Now working with minor bugs.
- 🧮 **Analytics Section**: Added to the database backend – frontend implementation coming soon.

---

### 🧪 Future Additions:
- ✏️ **PATCH and DELETE Endpoints**: Enable editing and deleting calculations or collections.
- ☁️ **Cloud Deployment Plans**:
  - 🌐 Frontend via **AWS CloudFront**
  - 🧠 Backend with **AWS Lambda**
  - 🔌 API through **API Gateway**
  - 💾 Database using **RDS (MariaDB)**

---

