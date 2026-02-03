# maydayworld.com

This is a website built using Angular and Angular Material.

### Getting Started

This project requires Node (`v12.3.1`+) and pnpm.

### Installing

Install dependencies with `pnpm install` from root directory.

### Running locally

Start a local server with `pnpm start`. Go to [http://localhost:4200](http://localhost:4200) from a
web browser.

### Building files

Build project with `pnpm build`. Output will be located in `/dist`. To build for production, use the
`--prod` flag.

### Testing

Run unit tests with `pnpm test`. After starting a local server, run end-to-end tests with `ng e2e`.

### Deploying

#### AWS

To deploy the build to AWS, run `pnpm run deploy -- <version>`.

#### Firebase

To build and deploy to Firebase, run `pnpm build:firebase`.

## License

Code is licensed under [Apache 2.0](/LICENSE).
