<div align="center">
  <img src="https://img.shields.io/badge/NestJS-E0234E?style=for-the-badge&logo=nestjs&logoColor=white" alt="NestJS Badge"/>
  <img src="https://img.shields.io/badge/PostgreSQL-316192?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL Badge"/>
  <img src="https://img.shields.io/badge/Prisma-3982CE?style=for-the-badge&logo=Prisma&logoColor=white" alt="Prisma Badge"/>
</div>

<h1 align="center">RESTful API with NestJS, PostgreSQL and Prisma </h1>

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

<h3>Prerequisites</h3>
<ul>
  <li>Node.js</li>
  <li>npm or yarn</li>
  <li>PostgreSQL installed and running</li>
</ul>

<h3>Installation</h3>

<ol>
  <li>Clone the repository:
    <pre><code>git clone https://github.com/roesparc/NestJs-PostgreSQL-Backend.git
cd NestJs-PostgreSQL-Backend</code></pre>
  </li>
  <li>Install dependencies:
    <pre><code>npm install
# or
yarn install</code></pre>
  </li>
  <li>
    <strong>Configure Environment:</strong>
    <p>
      The repository includes <code>.env</code> files with default values. You must adjust the database connection string (<code>DATABASE_URL</code>) variable to match your PostgreSQL setup (<code>user</code>, <code>password</code>, <code>host</code>, and <code>port</code>).
    </p>
    <pre><code># example
DATABASE_URL="postgresql://myuser:mypassword@localhost:5432/database"</code></pre>
  </li>
  <li>
    <strong>Run Prisma Migrations and Seed Database:</strong>
    <p>Apply migrations and run the seed script to populate the database with initial data.</p>
    <pre><code># development
npm run prisma:migrate:deploy:dev
npm run prisma:seed:dev</code></pre>

<pre><code># production
npm run prisma:migrate:deploy:prod
npm run prisma:seed:prod</code></pre>
  </li>
</ol>

<h3>Running the App</h3>

<pre><code># development
npm run start:dev</code></pre>

<pre><code># production build
npm run build
npm run start:prod</code></pre>
<p>
The application will be accessible at <code>http://localhost:3000</code> (or the port defined in your configuration).
</p>

<h3>API Documentation (Swagger)</h3>

<p>
Once the application is running, the interactive API documentation is available at:
</p>

<p align="center">
  <a href="http://localhost:3000/docs"><code>http://localhost:3000/docs</code></a>
</p>

---

<h2>Testing</h2>

<p>
This project includes a comprehensive test suite to ensure reliability.
</p>

<pre><code># run unit tests
npm run test</code></pre>

<pre><code># run e2e tests
npm run test:e2e</code></pre>
