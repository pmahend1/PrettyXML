export interface RepairedFragment {
    /** The document handed to the engine. Empty when `rejection` is set. */
    document: string;

    /** Why the engine cannot be asked to format this fragment. Empty when it can. */
    rejection: string;

    /** Prefixes bound to placeholder namespaces on the synthetic root so the parse succeeds. */
    syntheticPrefixes: string[];
}
