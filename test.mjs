// @ts-check
import { exec } from "child_process";
import { JSDOM } from "jsdom";
import fetch from "node-fetch";

async function test() {
  const dev = exec("yarn dev");

  if (!dev || !dev.stdout || !dev.stderr)
    throw new Error("Unable to start dev server");

  async function fetchPage() {
    // fetch the kitchen sink page (currently, homepage)
    const resp = await fetch("http://localhost:3000/"); // resp.status, resp.statusText (200 OK), resp.text();
    // convert to a DOM we can use
    const html = await resp.text();
    const dom = new JSDOM(html);
    // grab the NEXT data node
    const dataNode = dom.window.document.getElementById("__NEXT_DATA__");

    if (!dataNode) throw new Error("No __NEXT_DATA__ available");

    const data = JSON.parse(dataNode.innerHTML);

    return { resp, data };
  }

  dev.stdout.on("data", (data) => {
    console.log(`stdout: ${data}`);
    if (data.includes("started server on")) {
      // fetch and check for errors
      fetchPage()
        .then(({ resp, data }) => {
          dev.kill();
          console.log({ resp, data });
          console.log("All good.");

          // expect(fetched.data.err).not.toBeDefined();
          // expect(fetched.resp.status).toBe(200);
          process.exit(0);
          // done();
        })
        .catch((e) => {
          dev.kill();
          console.log(e);
          console.log("Not good.");
          process.exit(1);
          // throw e;
        });
    }
  });
}

test();
