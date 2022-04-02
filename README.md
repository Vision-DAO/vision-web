# Vision Web

This create-react-app project implements the Figma mockup UI for the Vision
platform.

## Getting Started

This project was built using yarn. Please install it [here](https://yarnpkg.com/getting-started/install). Once installed, grab the project's dependencies with:

```
yarn
```

Then, start the development server with:

```
yarn run dev
```

Then, head over to http://localhost:3000 to view the app.

## Conceptual Dependencies

### Ceramic

This application uses two data models from Ceramic, the [Crypto Account Links data model](https://github.com/ceramicstudio/datamodels/tree/main/packages/identity-accounts-crypto), and the [Identity Profile Basic data model](https://github.com/ceramicstudio/datamodels/tree/main/packages/identity-profile-basic).

The `Identity Profile Basic` data model is used for loading basic information, like usernames and profile pictures, about a user.

The `Crypto Account Links` data model is used to persist a user's list of owned ideas for discovery purposes.
