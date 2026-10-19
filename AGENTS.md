<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.
<!-- LOVABLE:END -->

## Curriculum architecture
- Keep the homepage's educational clinical workflow in a presentation-only component; it illustrates the pathway without implying live AI execution.
- Keep semester assignments, course identifiers and credit values in `src/lib/curriculum.ts`; all learning sections use this registry to prevent inconsistent subject mappings.
- Keep independently authored notes, viva prompts and BCQs linked to course identifiers, separate from extracted official course outlines; source provenance must remain distinguishable from study content.
- Serve the uploaded curriculum via a Lovable asset pointer and page-specific links so students can verify source content without committing a binary PDF.
