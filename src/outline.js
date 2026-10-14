export function branchEnd(nodes, index) {
  let end = index + 1;
  while (end < nodes.length && nodes[end].depth > nodes[index].depth) end++;
  return end;
}

export function visibleNodes(nodes) {
  let hiddenBelow = Infinity;
  return nodes.filter(node => {
    if (node.depth > hiddenBelow) return false;
    hiddenBelow = node.collapsed ? node.depth : Infinity;
    return true;
  });
}

export function splitNode(nodes, id, start, end, newId) {
  const index = nodes.findIndex(node => node.id === id);
  const node = nodes[index];
  const next = [...nodes];
  next[index] = { ...node, text: node.text.slice(0, start) };
  next.splice(branchEnd(nodes, index), 0, {
    id: newId, text: node.text.slice(end), depth: node.depth, collapsed: false,
  });
  return next;
}

export function indentNode(nodes, id) {
  const index = nodes.findIndex(node => node.id === id);
  const node = nodes[index];
  let sibling = index - 1;
  while (sibling >= 0 && nodes[sibling].depth > node.depth) sibling--;
  if (sibling < 0 || nodes[sibling].depth !== node.depth) return nodes;
  const end = branchEnd(nodes, index);
  return nodes.map((item, i) => i >= index && i < end
    ? { ...item, depth: item.depth + 1 }
    : i === sibling ? { ...item, collapsed: false } : item);
}

export function outdentNode(nodes, id) {
  const index = nodes.findIndex(node => node.id === id);
  if (nodes[index].depth === 0) return nodes;
  let parent = index - 1;
  while (nodes[parent].depth >= nodes[index].depth) parent--;
  const end = branchEnd(nodes, index);
  const destination = branchEnd(nodes, parent);
  const branch = nodes.slice(index, end).map(node => ({ ...node, depth: node.depth - 1 }));
  return [...nodes.slice(0, index), ...nodes.slice(end, destination),
    ...branch, ...nodes.slice(destination)];
}

export function removeEmptyNode(nodes, id) {
  const index = nodes.findIndex(node => node.id === id);
  if (nodes.length === 1 || nodes[index].text !== '') return nodes;
  const end = branchEnd(nodes, index);
  return nodes.filter(node => node.id !== id).map(node => {
    const oldIndex = nodes.indexOf(node);
    return oldIndex > index && oldIndex < end
      ? { ...node, depth: Math.max(0, node.depth - 1) } : node;
  });
}
