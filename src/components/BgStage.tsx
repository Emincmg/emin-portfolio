type Props = { mode: string; variant?: 'band' | 'sticky' };

/** A reserved area that the background canvas draws into while its section is active. */
export function BgStage({ mode, variant }: Props) {
  return <div className={['bgstage', variant].filter(Boolean).join(' ')} data-bg={mode} aria-hidden="true" />;
}
