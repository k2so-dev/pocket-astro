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
