import './lib/env';
import app from './server';

let port = 5000;
if (process.env.PORT) {
  port = +process.env.PORT;
}

app.listen(port, () => {
  console.log(`App listening on the http://localhost:${port}`);
});
