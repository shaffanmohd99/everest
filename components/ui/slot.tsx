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
  children: React.ReactElement;
};

const Slot = React.forwardRef<HTMLElement, SlotProps>(({ children, ...props }, ref) => {
  const child = children as React.ReactElement<any>;
  const mergedRef = composeRefs(ref, (child as { ref?: React.Ref<HTMLElement> }).ref);
  const childClassName = (child.props as { className?: string }).className;

  return React.cloneElement(
    child,
    {
      ...props,
      ref: mergedRef,
      className: [props.className, childClassName].filter(Boolean).join(" "),
    } as React.HTMLAttributes<HTMLElement>
  );
});

Slot.displayName = "Slot";

export { Slot };
