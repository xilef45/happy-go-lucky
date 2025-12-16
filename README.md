# Happy Go Lucky

Happy Go Lucky (HGL) is a web-based application to support agile software development. It is also used as an example application for teaching.

HGL allows for the creation of courses and projects within courses as well as self-registration of users (students) for projects.

The architecture is (supposed to be) modular. Functionality is provided as panels (the visual part of components). The three main out-of-the-box modules are

1. happiness index,
2. standup emails, and
3. code contribution graph.

HGL is developed as part of teaching software engineering at the Professorship for Open-Source Software at FAU Erlangen.

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Run development server:
   ```bash
   npm run dev
   ```

3. Open http://localhost:5173 in your browser

Default admin login: `sys@admin.org` / `helloworld`

## Mock Data

Generate sample data for local testing:
```bash
npm run generate-mockdata
```

Delete mock data:
```bash
npm run delete-mockdata
```

## Testing

Run automated tests:
```bash
npm run test
```


## Deployment

See [DEPLOYMENT.md](DEPLOYMENT.md) for production deployment instructions.