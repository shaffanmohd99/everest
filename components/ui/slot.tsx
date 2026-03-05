import * as React from "react";

function composeRefs<T>(...refs: Array<React.Ref<T> | undefined>) {
  return (node: T | null) => {
    refs.forEach((ref) => {
      if (!ref) return;
      if (typeof ref === "function") {
        ref(node);
      } else {
        (ref as React.MutableRefObject<T | null>).current = node;
      }
    });
  };
}

type SlotProps = React.HTMLAttributes<HTMLElement> & {
  children?: React.ReactElement;
};

const Slot = React.forwardRef<HTMLElement, SlotProps>(({ children, ...props }, ref) => {
  if (!React.isValidElement(children)) {
    return null;
  }

  const mergedRef = composeRefs(ref, (children as { ref?: React.Ref<HTMLElement> }).ref);

  return React.cloneElement(children, {
    ...props,
    ref: mergedRef,
    className: [props.className, children.props.className].filter(Boolean).join(" "),
  });
});

Slot.displayName = "Slot";

export { Slot };
