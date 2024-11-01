import { NodeEditor, GetSchemes, ClassicPreset } from "rete";
import { AreaPlugin, AreaExtensions } from "rete-area-plugin";
import {
  ConnectionPlugin,
  Presets as ConnectionPresets
} from "rete-connection-plugin";
import { ReactPlugin, Presets, ReactArea2D } from "rete-react-plugin";
import {
  AutoArrangePlugin,
  Presets as ArrangePresets
} from "rete-auto-arrange-plugin";

class Node extends ClassicPreset.Node {
  width = 180;
  height = 120;
}

class Connection<N extends Node> extends ClassicPreset.Connection<N, N> {}

type Schemes = GetSchemes<Node, Connection<Node>>;
type AreaExtra = ReactArea2D<Schemes>;

export async function createEditor(container: HTMLElement) {
  const socket = new ClassicPreset.Socket("socket");

  const editor = new NodeEditor<Schemes>();
  const area = new AreaPlugin<Schemes, AreaExtra>(container);
  const connection = new ConnectionPlugin<Schemes, AreaExtra>();
  const render = new ReactPlugin<Schemes, AreaExtra>();
  const arrange = new AutoArrangePlugin<Schemes>();

  AreaExtensions.selectableNodes(area, AreaExtensions.selector(), {
    accumulating: AreaExtensions.accumulateOnCtrl()
  });
  AreaExtensions.restrictor(area, {
    scaling: () => ({ min: 0.8, max: 1 }),
    translation: () => ({ left: 0, top: 0, right: 200, bottom: 200 })
  });
  AreaExtensions.snapGrid(area, {
    size: 20
  });

  render.addPreset(Presets.classic.setup());

  arrange.addPreset(ArrangePresets.classic.setup());

  connection.addPreset(ConnectionPresets.classic.setup());

  editor.use(area);
  area.use(connection);
  area.use(render);
  area.use(arrange);

  AreaExtensions.simpleNodesOrder(area);

  const a = new Node("A");
  a.addControl("a", new ClassicPreset.InputControl("text", {}));
  a.addOutput("a", new ClassicPreset.Output(socket));
  await editor.addNode(a);

  const b = new Node("B");
  b.addControl("b", new ClassicPreset.InputControl("text", {}));
  b.addInput("b", new ClassicPreset.Input(socket));
  await editor.addNode(b);

  (a as any).height = 140;
  (a as any).width = 200;
  (b as any).height = 140;
  (b as any).width = 200;

  await editor.addConnection(new Connection(a, "a", b, "b"));

  await arrange.layout();
  AreaExtensions.zoomAt(area, editor.getNodes());

  return {
    destroy: () => area.destroy()
  };
}
