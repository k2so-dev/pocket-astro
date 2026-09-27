/// <reference path="../data/types.d.ts" />

function rebuild(e) {
  e.next()
  const url = $os.getenv("BUILDER_URL")
  if (!url) return
  const collection = e.record.collection()
  if (collection.system || collection.isAuth()) return
  try {
    $http.send({ url, method: "POST", timeout: 2 })
  } catch (err) {
    $app.logger().warn("builder unreachable", "error", String(err))
  }
}

onRecordAfterCreateSuccess(rebuild)
onRecordAfterUpdateSuccess(rebuild)
onRecordAfterDeleteSuccess(rebuild)

routerAdd("GET", "/app/{path...}", $apis.static("/pb_public/current/app", true))

routerUse((e) => {
  try {
    return e.next()
  } catch (err) {
    const path = e.request.url.path
    if (e.request.method !== "GET" || path.startsWith("/api/") || path.startsWith("/_/")) throw err
    let html
    try {
      html = toString($os.readFile("/pb_public/current/404.html"))
    } catch {
      throw err
    }
    return e.html(404, html)
  }
})
