type Props = { mode: string; variant?: 'band' | 'sticky' };

/** A reserved area the background canvas moves into while its section is active; its caption hangs just below. */
export function BgStage({ mode, variant }: Props) {
  return (
    <div className={['bgstage', variant].filter(Boolean).join(' ')} data-bg={mode}>
      <p className="stage-hint" aria-hidden="true" />
    </div>
  );
}
