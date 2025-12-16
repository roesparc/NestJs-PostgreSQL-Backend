<div align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS Badge"/>
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL Badge"/>
  <img src="https://img.shields.io/badge/Docker-2496ED?style=for-the-badge&logo=docker&logoColor=white" alt="Docker Badge"/>
</div>

<h1 align="center">RESTful API with NestJS, PostgreSQL and Docker </h1>

---

<h2>Introduction</h2>

<p>
  This is a robust and scalable <strong>RESTful API</strong> built with <strong>NestJS</strong>, a progressive Node.js framework for building efficient and reliable server-side applications.
</p>

<p>
  This project serves as a comprehensive portfolio piece demonstrating modern back-end development practices, including database integration with <strong>Prisma ORM</strong>, <strong>JWT authentication</strong>, role-based access control with custom <strong>Guards</strong>, structured logging with <strong>Winston</strong> and full test coverage (unit + E2E) with <strong>Jest</strong>.
</p>

---

<h2>Key Features</h2>
<ul>
  <li><strong>Framework:</strong> Built on <strong>NestJS</strong> (TypeScript) for modular, maintainable, and highly testable code.</li>
  <li><strong>Database:</strong> <strong>PostgreSQL</strong> used as the primary data store.</li>
  <li><strong>ORM:</strong> <strong>Prisma</strong> is utilized as the type-safe database toolkit.</li>
  <li><strong>Authentication:</strong> Secure <strong>JWT</strong> (JSON Web Token) authentication with custom <code>JwtStrategy</code> and <code>JwtAuthGuard</code>.</li>
  <li><strong>Security:</strong> All routes are protected by the <code>JwtAuthGuard</code> by default (globally applied), requiring a valid JWT unless explicitly decorated with <code>@Public()</code>.</li>
  <li><strong>Authorization:</strong> <strong>Role-Based Access Control (RBAC)</strong> implemented using a custom <code>RolesGuard</code> and <code>@Roles()</code> decorator.</li>
  <li><strong>Core API Modules:</strong> Implements complete <strong>CRUD</strong> and business logic across essential domain modules.</li>
  <li><strong>Validation & Serialization:</strong> Extensive use of NestJS <strong>pipes and DTOs</strong> (Data Transfer Objects) for strong input validation and clear data shaping.</li>
  <li><strong>Logging:</strong> Centralized and structured application logging using <strong>Winston (<code>AppLogger</code>)</strong> with monthly rotataion.</li>
  <li><strong>Testing:</strong> Comprehensive <strong>Unit</strong> and <strong>End-to-End (E2E)</strong> tests using Jest.</li>
  <li><strong>Documentation:</strong> <strong>Swagger</strong> integration for automatic API documentation.</li>
</ul>

---

<h2>Architecture Overview</h2>

<p>
The application follows the principles of the <strong>Modular Monolith</strong> and <strong>Clean Architecture</strong> as enforced by NestJS.
</p>
<ul>
  <li><strong>Modules:</strong> The application is divided into feature-specific modules.</li>
  <li><strong>Controllers:</strong> Handle incoming HTTP requests, process input validation, and delegate business logic to the services.</li>
  <li><strong>Services:</strong> Contain the core application logic and interact with the database via the Prisma Service.</li>
  <li><strong>Guards:</strong> Implement authorization logic (e.g., <code>JwtAuthGuard</code>, <code>RolesGuard</code>).</li>
  <li><strong>PrismaModule:</strong> Encapsulates the database connection and exposes the <code>PrismaService</code> for all feature modules.</li>
</ul>



---

<h2>Module Deep Dive: <code>Users</code></h2>

<p>
The <code>Users</code> module is a prime example of the project's adherence to modern standards, exposing a full set of functionalities:
</p>

<table>
  <thead>
    <tr>
      <th>Endpoint</th>
      <th>Method</th>
      <th>Description</th>
      <th>Access Control</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>/users</code></td>
      <td><code>POST</code></td>
      <td><strong>Create</strong> a new user (public registration).</td>
      <td>Public</td>
    </tr>
    <tr>
      <td><code>/users</code></td>
      <td><code>GET</code></td>
      <td><strong>Retrieve</strong> list of users with comprehensive filters, sorting, and pagination.</td>
      <td>Authenticated</td>
    </tr>
    <tr>
      <td><code>/users/id/:id</code></td>
      <td><code>PATCH</code></td>
      <td><strong>Update</strong> a user's profile.</td>
      <td>Self or ADMIN</td>
    </tr>
    <tr>
      <td><code>/users/id/:id</code></td>
      <td><code>DELETE</code></td>
      <td><strong>Delete</strong> a user.</td>
      <td>ADMIN</td>
    </tr>
    <tr>
      <td><code>/users/check-username/:username</code></td>
      <td><code>GET</code></td>
      <td>Check if a username is available.</td>
      <td>Public</td>
    </tr>
    <tr>
      <td><code>/users/me</code></td>
      <td><code>GET</code></td>
      <td>Get the currently authenticated user's profile.</td>
      <td>Authenticated</td>
    </tr>
    <tr>
      <td><code>/users/update-password/:id</code></td>
      <td><code>PATCH</code></td>
      <td>Update a user's password.</td>
      <td>Self</td>
    </tr>
    <tr>
      <td><code>/users/assign-role</code></td>
      <td><code>PATCH</code></td>
      <td>Assign a role to a user.</td>
      <td>ADMIN</td>
    </tr>
    <tr>
      <td><code>/users/remove-role</code></td>
      <td><code>PATCH</code></td>
      <td>Remove a role from a user.</td>
      <td>ADMIN</td>
    </tr>
  </tbody>
</table>

---

<h2>Getting Started</h2>

<p>
  This project is designed to be run <strong>primarily using Docker</strong>, ensuring consistent environments across
  <strong>development</strong>, <strong>testing</strong>, and <strong>production</strong>.
</p>

<h3>Prerequisites</h3>
<ul>
  <li><strong>Docker Desktop</strong></li>
</ul>

<p>
  A local PostgreSQL installation is <strong>not required</strong>.
</p>

<h3>Environment Configuration</h3>

<p>
  Each environment is configured independently using <code>.env</code> files located under:
</p>

<pre><code>docker/
 ├── dev/
 │   └── .env
 ├── test/
 │   └── .env
 └── prod/
     └── .env</code></pre>

<p>
  Review and adjust these files as needed (ports, credentials, secrets, etc.).
</p>

<h3>Running the Application (Development)</h3>

<p>
  To start the application in <strong>development mode</strong> using Docker:
</p>

<pre><code>docker compose -f docker/dev/compose.yml watch</code></pre>

<p>
  This command will:
</p>
<ul>
  <li>Build the development images</li>
  <li>Start a PostgreSQL container</li>
  <li>
    Run the <strong>init</strong> service to:
    <ul>
      <li>Generate the Prisma client (<code>prisma generate</code>)</li>
      <li>Apply database migrations (<code>prisma migrate deploy</code>)</li>
      <li>Seed the database with initial data (<code>prisma db seed</code>)</li>
    </ul>
  </li>
  <li>Start the NestJS application in <strong>watch mode</strong></li>
  <li>Start a Prisma Studio container</li>
  <li>Automatically reload the app on code changes</li>
</ul>

<p>
  The API will be available at:
</p>

<pre><code>http://localhost:3000</code></pre>

<p>
  Swagger documentation is available at:
</p>

<p align="center">
  <a href="http://localhost:3000/docs"><code>http://localhost:3000/docs</code></a>
</p>

<p>
  To stop and clean up the development environment:
</p>

<pre><code>docker compose -f docker/dev/compose.yml down</code></pre>

<h3>Running Tests (Docker)</h3>

<p>
  End-to-End tests are executed against an isolated Docker environment.
</p>

<pre><code>docker compose -f docker/test/compose.yml up</code></pre>

<p>
  This will:
</p>
<ul>
  <li>Spin up a dedicated test database</li>
  <li>Execute the Jest E2E test suite</li>
</ul>

<p>
  After completion, bring the environment down:
</p>

<pre><code>docker compose -f docker/test/compose.yml down</code></pre>

<h3>Prisma Utilities (Docker)</h3>

<p>
  Prisma commands can be executed inside the running development container.
</p>

<pre><code>docker compose -f docker/dev/compose.yml exec api npx jest</code></pre>

<h3>Production</h3>

<p>
  A production-ready Dockerfile is available under:
</p>

<pre><code>docker/prod</code></pre>

<p>
  This setup runs a compiled NestJS build.
</p>

<p>
  <em>
    Production deployment is infrastructure-specific and should be adapted to the hosting or orchestration platform. For this project, the application was deployed on <strong>Render.com</strong> using <strong>Docker</strong> as the runtime environment.
  </em>
</p>
