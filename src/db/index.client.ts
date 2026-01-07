const serverOnlyMessage =
	"db is server-only and should not be imported in the client bundle.";

export const db = new Proxy(
	{},
	{
		get() {
			throw new Error(serverOnlyMessage);
		},
	},
) as never;
